import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { isIP } from 'net';
import { Model, Types } from 'mongoose';
import { CartsService } from '../carts/carts.service';
import {
  ComeshAddress,
  ComeshEnvelope,
  ComeshPaymentData,
  ComeshPaymentRequest,
  ComeshRefundData,
  ComeshWebhookEvent,
} from '../payments/gateways/comesh.gateway';
import { PaymentCredentialsService } from '../payments/payment-credentials.service';
import { PaymentGatewaysService } from '../payments/payment-gateways.service';
import {
  GatewayPaymentMethod,
  PaymentEnvironment,
} from '../payments/payment.types';
import { PaymentWebhooksService } from '../payments/payment-webhooks.service';
import { PaymentCredential } from '../payments/schema/payment-credential.schema';
import { Product } from '../products/schema/product.schema';
import { PromotionsService } from '../promotions/promotions.service';
import {
  PaymentMethod,
  TransactionStatus,
  TransactionType,
} from '../transactions/schema/transaction.schema';
import { TransactionsService } from '../transactions/transactions.service';
import { User, UserRole } from '../users/schema/user.schema';
import { CheckoutDto } from './dto/checkout.dto';
import { RefundOrderDto } from './dto/refund-order.dto';
import {
  ComeshPaymentSourceDto,
  ComeshPaymentSourceType,
  OnlinePaymentDto,
  PaymentAddressDto,
} from './dto/online-payment.dto';
import { Order, OrderPromotion, OrderStatus } from './schema/order.schema';

export interface CheckoutRequestContext {
  clientIp?: string;
  userAgent?: string;
  acceptLanguage?: string;
}

export interface GatewayCheckoutResult {
  paymentId?: string;
  merchantOrderNo: string;
  status: string;
  provider: string;
  paymentMethod: string;
  nextAction?:
    { type: 'redirect'; redirectUrl: string } | { type: 'html'; html: string };
  code: string;
  message: string;
}

/**
 * Turns a cart into an order, and optionally starts a real online payment.
 * Online transactions stay pending until ComesH reports/query confirms a final
 * result; raw card data is only used to make the outbound request.
 */
@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly cartsService: CartsService,
    private readonly promotionsService: PromotionsService,
    private readonly transactionsService: TransactionsService,
    private readonly paymentCredentialsService: PaymentCredentialsService,
    private readonly paymentGatewaysService: PaymentGatewaysService,
    private readonly paymentWebhooksService: PaymentWebhooksService,
    private readonly config: ConfigService,
  ) {}

  async checkout(
    userId: string,
    dto: CheckoutDto,
    requestContext: CheckoutRequestContext = {},
  ) {
    const cart = await this.cartsService.getRawCart(userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Giỏ hàng đang trống');
    }

    // Validate the selected provider before claiming stock or a promotion.
    const credential = dto.payment
      ? await this.resolveOnlinePaymentCredential(dto.payment)
      : undefined;

    const products = await this.productModel
      .find({ _id: { $in: cart.items.map((i) => i.productId) } })
      .exec();
    const byId = new Map(products.map((p) => [p._id.toString(), p]));

    const orderItems = cart.items.map((it) => {
      const product = byId.get(it.productId.toString());
      if (!product) {
        throw new BadRequestException(
          'Một sản phẩm trong giỏ không còn tồn tại',
        );
      }
      if (product.stock < it.quantity) {
        throw new ConflictException(
          `Không đủ tồn kho cho "${product.name}" (còn ${product.stock})`,
        );
      }
      return {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: it.quantity,
        subtotal: product.price * it.quantity,
      };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    let promotion: OrderPromotion | undefined;
    if (dto.promotionCode) {
      const check = await this.promotionsService.validateForOrder(
        dto.promotionCode,
        userId,
        subtotal,
      );
      promotion = {
        promotionId: check.promotion._id,
        code: check.promotion.code,
        discountType: check.promotion.discountType,
        discountValue: check.promotion.discountValue,
        discountAmount: check.discount,
      };
    }

    const decremented: Array<{ productId: Types.ObjectId; quantity: number }> =
      [];
    for (const item of orderItems) {
      const result = await this.productModel
        .updateOne(
          { _id: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
        )
        .exec();
      if (result.modifiedCount !== 1) {
        await this.restock(decremented);
        throw new ConflictException(
          `Tồn kho của "${item.name}" vừa thay đổi, vui lòng thử lại`,
        );
      }
      decremented.push({ productId: item.productId, quantity: item.quantity });
    }

    if (promotion) {
      try {
        await this.promotionsService.consume(promotion.promotionId);
      } catch (error) {
        await this.restock(decremented);
        throw error;
      }
    }

    const discount = promotion?.discountAmount ?? 0;
    const order = new this.orderModel({
      userId: new Types.ObjectId(userId),
      items: orderItems,
      subtotal,
      discount,
      promotion,
      totalPrice: subtotal - discount,
      status: OrderStatus.PENDING,
      shippingAddress: dto.shippingAddress,
      paymentProvider: credential?.provider,
    });
    if (credential) {
      order.merchantOrderNo = `ORDER-${order._id.toString()}`;
    }

    try {
      await order.save();
    } catch (error) {
      if (promotion)
        await this.promotionsService.release(promotion.promotionId);
      await this.restock(decremented);
      throw error;
    }

    // The order now owns the cart quantities, even while the customer handles
    // a 3DS redirect. This prevents a second checkout from double-reserving it.
    await this.cartsService.clearCart(userId);

    if (credential && dto.payment) {
      const customer = await this.userModel.findById(userId).exec();
      if (!customer) {
        // This is unexpected after JWT authentication; retain the order rather
        // than trying to unwind a persisted checkout.
        throw new NotFoundException('Không tìm thấy người dùng thanh toán');
      }
      const payment = await this.startOnlinePayment(
        order,
        customer,
        dto.payment,
        credential,
        requestContext,
      );
      return { ...order.toObject(), payment };
    }

    // Backward-compatible COD/manual checkout.
    await this.transactionsService.record({
      orderId: order._id,
      userId: new Types.ObjectId(userId),
      type: TransactionType.PAYMENT,
      amount: order.totalPrice,
      method: dto.paymentMethod ?? PaymentMethod.COD,
      note: 'Payment recorded at checkout',
    });
    return order;
  }

  /** Reconcile an order after a return URL or a temporary webhook failure. */
  async refreshPaymentStatus(orderId: string, userId: string, role: UserRole) {
    const order = await this.findByIdOrThrow(orderId);
    if (role !== UserRole.ADMIN && order.userId.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem đơn hàng này');
    }
    const transaction = await this.transactionsService.findOnlinePayment(
      order._id,
    );
    if (!transaction?.paymentCredentialId || !transaction.merchantReference) {
      throw new NotFoundException(
        'Đơn hàng không có thanh toán online để đối soát',
      );
    }

    const credential = await this.paymentCredentialsService.findInternalById(
      transaction.paymentCredentialId.toString(),
    );
    let payment: ComeshPaymentData | undefined;
    let code = 'SUCCESS';
    let message = 'Payment found';
    if (transaction.gatewayPaymentId) {
      const response = await this.paymentGatewaysService.queryPayment(
        credential,
        transaction.gatewayPaymentId,
      );
      if (!response.success || !response.data) {
        throw new BadGatewayException(
          response.message || 'Không thể đối soát ComesH',
        );
      }
      payment = response.data;
      code = response.code;
      message = response.message;
    } else {
      const response =
        await this.paymentGatewaysService.queryPaymentsByMerchantOrderNo(
          credential,
          transaction.merchantReference,
        );
      if (!response.success) {
        throw new BadGatewayException(
          response.message || 'Không thể đối soát ComesH',
        );
      }
      payment = response.data?.payments.find(
        (item) => item.merchantOrderNo === transaction.merchantReference,
      );
      code = response.code;
      message = response.message;
    }
    if (!payment) {
      return {
        ...order.toObject(),
        payment: {
          merchantOrderNo: transaction.merchantReference,
          status: 'pending',
          provider: credential.provider,
          paymentMethod: transaction.method,
          code,
          message: 'Chưa có kết quả thanh toán từ cổng.',
        } satisfies GatewayCheckoutResult,
      };
    }

    await this.applyPaymentState(order, transaction._id, payment);
    return {
      ...order.toObject(),
      payment: this.toCheckoutResult(
        credential.provider,
        this.toTransactionMethod(
          payment.paymentMethod?.type,
          transaction.method,
        ),
        { code, message, data: payment },
      ),
    };
  }

  async retryPayment(
    orderId: string,
    userId: string,
    role: UserRole,
    payment: OnlinePaymentDto,
    requestContext: CheckoutRequestContext,
  ) {
    const order = await this.findByIdOrThrow(orderId);
    if (role !== UserRole.ADMIN && order.userId.toString() !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền thanh toán đơn hàng này',
      );
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new ConflictException('Chỉ có thể thanh toán lại đơn hàng pending');
    }
    const previous = await this.transactionsService.findOnlinePayment(
      order._id,
    );
    if (
      !previous ||
      previous.status === TransactionStatus.SUCCESS ||
      previous.status === TransactionStatus.PENDING
    ) {
      throw new ConflictException(
        'Đơn hàng chưa có giao dịch failed để thanh toán lại',
      );
    }
    const credential = await this.resolveOnlinePaymentCredential(payment);
    const customer = await this.userModel.findById(order.userId).exec();
    if (!customer) throw new NotFoundException('Không tìm thấy khách hàng');
    const result = await this.startOnlinePayment(
      order,
      customer,
      payment,
      credential,
      requestContext,
    );
    return { ...order.toObject(), payment: result };
  }

  /** Called by the public ComesH webhook endpoint after raw-body verification. */
  async handleComeshWebhook(
    timestamp: string | undefined,
    signature: string | undefined,
    rawBody: string,
  ): Promise<void> {
    const credentials =
      await this.paymentCredentialsService.findForWebhook('comesh');
    const credential = credentials.find((candidate) =>
      this.paymentGatewaysService.verifyWebhook(
        candidate,
        timestamp,
        signature,
        rawBody,
      ),
    );
    if (!credential) {
      throw new UnauthorizedException('Webhook signature không hợp lệ');
    }

    let event: ComeshWebhookEvent;
    try {
      event = JSON.parse(rawBody) as ComeshWebhookEvent;
    } catch {
      throw new BadRequestException('Webhook body không phải JSON hợp lệ');
    }
    if (
      !event.eventId ||
      !['payment.updated', 'refund.updated'].includes(event.eventType) ||
      !event.data
    ) {
      throw new BadRequestException('Webhook ComesH không đúng cấu trúc');
    }

    const claimed = await this.paymentWebhooksService.claim(
      event.eventId,
      credential.provider,
      event.eventType,
    );
    if (!claimed) return;

    try {
      if (event.eventType === 'payment.updated') {
        await this.applyPaymentWebhook(
          credential,
          event.data as ComeshPaymentData,
          event.eventId,
        );
      } else {
        await this.applyRefundWebhook(
          credential,
          event.data as ComeshRefundData,
          event.eventId,
        );
      }
    } catch (error) {
      // A non-SUCCESS response makes ComesH retry. Releasing the event claim
      // ensures the retry can process it instead of being treated as a duplicate.
      await this.paymentWebhooksService.discard(event.eventId);
      throw error;
    }
  }

  /** Orders belonging to the current user, newest first. */
  findMine(userId: string) {
    return this.orderModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  /** A single order the user owns (admins may read any order), with transactions. */
  async findOneForUser(orderId: string, userId: string, role: UserRole) {
    const order = await this.orderModel
      .findById(orderId)
      .populate('userId', 'name email')
      .exec();
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    const ownerId =
      typeof order.userId === 'object' &&
      order.userId !== null &&
      '_id' in order.userId
        ? String((order.userId as unknown as { _id: Types.ObjectId })._id)
        : String(order.userId);
    if (role !== UserRole.ADMIN && ownerId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem đơn hàng này');
    }
    const transactions = await this.transactionsService.findByOrder(order._id);
    return { ...order.toObject(), transactions };
  }

  /** User cancels an unfulfilled order. Gateway refunds are deliberately not automatic. */
  async cancel(orderId: string, userId: string, role: UserRole) {
    const order = await this.findByIdOrThrow(orderId);
    if (role !== UserRole.ADMIN && order.userId.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền hủy đơn hàng này');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new ConflictException(
        'Chỉ có thể hủy đơn hàng đang ở trạng thái pending',
      );
    }
    // ComesH v3 documents no payment-cancel call. Leaving an online payment
    // pending would create a race where a later capture pays a cancelled order.
    const onlinePayment = await this.transactionsService.findOnlinePayment(
      order._id,
    );
    if (onlinePayment?.status === TransactionStatus.PENDING) {
      throw new ConflictException(
        'Thanh toán online đang chờ kết quả; hãy đối soát trước khi hủy đơn',
      );
    }
    await this.restock(
      order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    );
    if (order.promotion) {
      await this.promotionsService.release(order.promotion.promotionId);
    }
    order.status = OrderStatus.CANCELLED;
    await order.save();

    if (!onlinePayment) {
      await this.transactionsService.record({
        orderId: order._id,
        userId: order.userId,
        type: TransactionType.REFUND,
        amount: order.totalPrice,
        note: 'Refund issued for cancelled order',
      });
    }
    return order;
  }

  /** Create a ComesH full/partial refund for a previously captured payment. */
  async refund(
    orderId: string,
    dto: RefundOrderDto,
  ): Promise<Record<string, unknown>> {
    const order = await this.findByIdOrThrow(orderId);
    if (order.status === OrderStatus.CANCELLED) {
      throw new ConflictException('Không thể hoàn tiền cho đơn đã bị hủy');
    }
    const payment = await this.transactionsService.findGatewayPayment(
      order._id,
    );
    if (
      !payment ||
      payment.status !== TransactionStatus.SUCCESS ||
      !payment.gatewayPaymentId ||
      !payment.paymentCredentialId
    ) {
      throw new ConflictException(
        'Đơn hàng chưa có thanh toán online đã capture',
      );
    }

    const reservedAmount = await this.transactionsService.reservedRefundAmount(
      order._id,
    );
    const amount = dto.amount ?? payment.amount - reservedAmount;
    if (
      amount <= 0 ||
      amount > payment.amount - reservedAmount + Number.EPSILON
    ) {
      throw new BadRequestException(
        'Số tiền refund vượt quá số tiền còn được hoàn',
      );
    }

    const credential = await this.paymentCredentialsService.findInternalById(
      payment.paymentCredentialId.toString(),
    );
    const merchantRefundNo = `REFUND-${order._id.toString()}-${randomUUID().slice(0, 8)}`;
    const idempotencyKey = randomUUID();
    const transaction = await this.transactionsService.record({
      orderId: order._id,
      userId: order.userId,
      type: TransactionType.REFUND,
      amount,
      currency: payment.currency ?? credential.currency,
      method: payment.method,
      status: TransactionStatus.PENDING,
      provider: credential.provider,
      paymentCredentialId: credential._id,
      merchantReference: merchantRefundNo,
      idempotencyKey,
      providerStatus: 'created',
      note: dto.reason,
    });

    try {
      const response = await this.paymentGatewaysService.createRefund(
        credential,
        {
          paymentId: payment.gatewayPaymentId,
          merchantRefundNo,
          amount: {
            value: this.formatAmount(amount),
            currency: payment.currency ?? credential.currency,
          },
          reason: dto.reason,
          metadata: { orderId: order._id.toString() },
        },
        idempotencyKey,
      );
      if (!response.success || !response.data) {
        await this.transactionsService.updateGatewayRefund(transaction._id, {
          providerStatus: 'failed',
          status: TransactionStatus.FAILED,
          note: response.message,
        });
        return {
          success: false,
          code: response.code,
          message: response.message,
          merchantRefundNo,
        };
      }

      await this.transactionsService.updateGatewayRefund(transaction._id, {
        gatewayRefundId: response.data.refundId,
        providerStatus: response.data.status,
        status: this.toRefundTransactionStatus(response.data.status),
        note: response.data.reason ?? dto.reason,
      });
      return {
        success: true,
        code: response.code,
        message: response.message,
        provider: credential.provider,
        refundId: response.data.refundId,
        merchantRefundNo: response.data.merchantRefundNo,
        status: response.data.status,
      };
    } catch (error) {
      // The provider may have received a POST just before a timeout. Preserve
      // this row (and its idempotency key) for manual reconciliation instead of
      // issuing a second refund blindly.
      const message =
        error instanceof Error ? error.message : 'Không thể tạo refund';
      await this.transactionsService.updateGatewayRefund(transaction._id, {
        providerStatus: 'unknown',
        status: TransactionStatus.PENDING,
        note: message,
      });
      return {
        success: false,
        code: 'GATEWAY_UNAVAILABLE',
        message: 'Refund đang chờ đối soát với cổng thanh toán.',
        merchantRefundNo,
      };
    }
  }

  // ---- Admin ----

  findAll() {
    return this.orderModel
      .find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean()
      .exec()
      .then(async (orders) =>
        Promise.all(
          orders.map(async (order) => ({
            ...order,
            transactions: await this.transactionsService.findByOrder(order._id),
          })),
        ),
      );
  }

  async updateStatus(orderId: string, status: OrderStatus) {
    const order = await this.findByIdOrThrow(orderId);
    order.status = status;
    await order.save();
    return order;
  }

  // ---- online payment helpers ----

  private async resolveOnlinePaymentCredential(
    payment: OnlinePaymentDto,
  ): Promise<PaymentCredential> {
    const checkoutEnvironment =
      this.config.get<PaymentEnvironment>('payment.environment') ??
      PaymentEnvironment.SANDBOX;
    if (payment.environment && payment.environment !== checkoutEnvironment) {
      throw new BadRequestException(
        `Checkout chỉ hỗ trợ environment ${checkoutEnvironment}`,
      );
    }
    const credential =
      await this.paymentCredentialsService.findActiveForProvider(
        payment.provider,
        checkoutEnvironment,
      );
    this.paymentGatewaysService.assertSupported(credential);

    if (!credential.paymentMethods.includes(payment.paymentMethod)) {
      throw new BadRequestException(
        `Phương thức ${payment.paymentMethod} chưa được bật cho ${credential.provider}`,
      );
    }
    if (
      payment.cardBrand &&
      !credential.cardBrands.includes(payment.cardBrand)
    ) {
      throw new BadRequestException(
        `Loại thẻ ${payment.cardBrand} chưa được bật cho ${credential.provider}`,
      );
    }
    // v3 only documents card/checkout/token sources. Google Pay and Apple Pay
    // may be configured for a future adapter but must not be sent to ComesH as
    // if the API supported them.
    if (
      credential.provider === 'comesh' &&
      payment.paymentMethod !== GatewayPaymentMethod.CARD
    ) {
      throw new BadRequestException(
        'ComesH v3 hiện chỉ tài liệu hóa thanh toán thẻ (source checkout/card/token)',
      );
    }
    return credential;
  }

  private async startOnlinePayment(
    order: Order,
    customer: User,
    payment: OnlinePaymentDto,
    credential: PaymentCredential,
    requestContext: CheckoutRequestContext,
  ): Promise<GatewayCheckoutResult> {
    const idempotencyKey = payment.token ?? randomUUID();
    const transaction = await this.transactionsService.record({
      orderId: order._id,
      userId: order.userId,
      type: TransactionType.PAYMENT,
      amount: order.totalPrice,
      currency: credential.currency,
      method: this.toTransactionMethod(payment.paymentMethod),
      status: TransactionStatus.PENDING,
      provider: credential.provider,
      paymentCredentialId: credential._id,
      merchantReference: order.merchantOrderNo,
      idempotencyKey,
      providerStatus: 'created',
      note: `Payment initiated with ${credential.provider}`,
    });

    let response: ComeshEnvelope<ComeshPaymentData>;
    try {
      response = await this.paymentGatewaysService.createPayment(
        credential,
        this.buildComeshPaymentRequest(
          order,
          customer,
          payment,
          credential,
          requestContext,
        ),
        idempotencyKey,
      );
    } catch (error) {
      // A timeout can occur after the provider accepted the idempotent request.
      // Keep it pending, so a webhook or GET reconciliation remains authoritative.
      const message =
        error instanceof Error ? error.message : 'Không thể tạo thanh toán';
      await this.transactionsService.updateGatewayPayment(transaction._id, {
        providerStatus: 'unknown',
        status: TransactionStatus.PENDING,
        note: message,
      });
      return {
        merchantOrderNo: order.merchantOrderNo ?? '',
        status: 'pending',
        provider: credential.provider,
        paymentMethod: payment.paymentMethod,
        code: 'GATEWAY_UNAVAILABLE',
        message:
          'Đơn hàng đã được tạo. Hãy đối soát lại trạng thái thanh toán.',
      };
    }

    if (!response.success || !response.data) {
      await this.transactionsService.updateGatewayPayment(transaction._id, {
        providerStatus: 'failed',
        status: TransactionStatus.FAILED,
        note: response.message,
      });
      return {
        merchantOrderNo: order.merchantOrderNo ?? '',
        status: 'failed',
        provider: credential.provider,
        paymentMethod: payment.paymentMethod,
        code: response.code,
        message: response.message,
      };
    }

    await this.applyPaymentState(
      order,
      transaction._id,
      response.data,
      payment.paymentMethod,
    );
    return this.toCheckoutResult(
      credential.provider,
      payment.paymentMethod,
      response,
    );
  }

  private buildComeshPaymentRequest(
    order: Order,
    customer: User,
    payment: OnlinePaymentDto,
    credential: PaymentCredential,
    requestContext: CheckoutRequestContext,
  ): ComeshPaymentRequest {
    const clientIp = requestContext.clientIp;
    if (!clientIp || isIP(clientIp) === 0) {
      throw new BadRequestException(
        'Không xác định được địa chỉ IP của khách hàng',
      );
    }
    const userAgent = payment.browser.userAgent ?? requestContext.userAgent;
    if (!userAgent) {
      throw new BadRequestException(
        'Thiếu thông tin trình duyệt của khách hàng',
      );
    }

    const amount = {
      value: this.formatAmount(order.totalPrice),
      currency: credential.currency,
    };
    return {
      merchantOrderNo: order.merchantOrderNo ?? `ORDER-${order._id.toString()}`,
      order: {
        amount,
        placedAt: new Date().toISOString(),
        description: `Order ${order.merchantOrderNo ?? order._id.toString()}`,
        items: order.items.map((item) => ({
          sku: item.productId.toString(),
          name: item.name,
          unitPrice: {
            value: this.formatAmount(item.price),
            currency: credential.currency,
          },
          quantity: item.quantity,
        })),
      },
      customer: {
        email: customer.email,
        phone: customer.profile?.phone,
        ip: clientIp,
      },
      browser: {
        userAgent,
        acceptLanguage:
          payment.browser.acceptLanguage ??
          requestContext.acceptLanguage?.split(',')[0],
        screenWidth: payment.browser.screenWidth,
        screenHeight: payment.browser.screenHeight,
        timeZoneOffset: payment.browser.timeZoneOffset,
      },
      billingAddress: this.toComeshAddress(payment.billingAddress),
      shippingAddress: payment.shippingAddress
        ? this.toComeshAddress(payment.shippingAddress)
        : undefined,
      paymentSource: this.toComeshSource(payment.source),
      callbacks: {
        returnUrl: this.returnUrlForOrder(
          payment.returnUrl ?? this.defaultReturnUrl(),
          order._id.toString(),
        ),
        notifyUrl: this.notifyUrl(),
      },
      locale: payment.locale,
      metadata: this.toStringMetadata(payment.metadata),
    };
  }

  private async applyPaymentWebhook(
    credential: PaymentCredential,
    payment: ComeshPaymentData,
    eventId: string,
  ) {
    if (!payment.paymentId || !payment.status) {
      throw new BadRequestException(
        'Payment webhook thiếu paymentId hoặc status',
      );
    }
    const transaction = await this.transactionsService.findGatewayPaymentById(
      credential.provider,
      payment.paymentId,
    );
    if (!transaction) {
      throw new NotFoundException('Không tìm thấy giao dịch ComesH tương ứng');
    }
    if (
      transaction.paymentCredentialId &&
      transaction.paymentCredentialId.toString() !== credential._id.toString()
    ) {
      throw new UnauthorizedException(
        'Webhook không khớp environment đã tạo thanh toán',
      );
    }

    const order = await this.findByIdOrThrow(transaction.orderId.toString());
    const updated = await this.applyPaymentState(
      order,
      transaction._id,
      payment,
    );
    await this.paymentWebhooksService.attachTransaction(eventId, updated._id);
  }

  private async applyRefundWebhook(
    credential: PaymentCredential,
    refund: ComeshRefundData,
    eventId: string,
  ) {
    if (!refund.refundId || !refund.status) {
      throw new BadRequestException(
        'Refund webhook thiếu refundId hoặc status',
      );
    }
    const transaction = await this.transactionsService.findGatewayRefundById(
      credential.provider,
      refund.refundId,
    );
    if (!transaction) {
      throw new NotFoundException('Không tìm thấy refund ComesH tương ứng');
    }
    const updated = await this.transactionsService.updateGatewayRefund(
      transaction._id,
      {
        providerStatus: refund.status,
        status: this.toRefundTransactionStatus(refund.status),
      },
    );
    await this.paymentWebhooksService.attachTransaction(eventId, updated._id);
  }

  private async applyPaymentState(
    order: Order,
    transactionId: Types.ObjectId,
    payment: ComeshPaymentData,
    requestedMethod?: GatewayPaymentMethod,
  ) {
    const updated = await this.transactionsService.updateGatewayPayment(
      transactionId,
      {
        gatewayPaymentId: payment.paymentId,
        providerStatus: payment.status,
        status: this.toPaymentTransactionStatus(payment.status),
        method: this.toTransactionMethod(
          payment.paymentMethod?.type,
          requestedMethod
            ? this.toTransactionMethod(requestedMethod)
            : undefined,
        ),
        cardBrand: payment.paymentMethod?.card?.brand,
        cardLastFour: payment.paymentMethod?.card?.lastFour,
      },
    );
    if (payment.status === 'captured' && order.status === OrderStatus.PENDING) {
      order.status = OrderStatus.PAID;
      await order.save();
    }
    return updated;
  }

  private toCheckoutResult(
    provider: string,
    requestedMethod: GatewayPaymentMethod | PaymentMethod,
    response: { code: string; message: string; data?: ComeshPaymentData },
  ): GatewayCheckoutResult {
    const data = response.data;
    return {
      paymentId: data?.paymentId,
      merchantOrderNo: data?.merchantOrderNo ?? '',
      status: data?.status ?? 'pending',
      provider,
      paymentMethod: data?.paymentMethod?.type ?? requestedMethod,
      nextAction: data?.nextAction,
      code: response.code,
      message: response.message,
    };
  }

  private toComeshAddress(address: PaymentAddressDto): ComeshAddress {
    return {
      ...address,
      country: address.country.toUpperCase(),
    };
  }

  private toComeshSource(
    source: ComeshPaymentSourceDto,
  ): ComeshPaymentRequest['paymentSource'] {
    if (source.type === ComeshPaymentSourceType.CHECKOUT)
      return { type: 'checkout' };
    if (source.type === ComeshPaymentSourceType.CARD) {
      if (!source.card) throw new BadRequestException('Thiếu thông tin thẻ');
      return { type: 'card', card: source.card };
    }
    if (!source.token) throw new BadRequestException('Thiếu payment token');
    return { type: 'token', token: source.token };
  }

  private toStringMetadata(
    metadata: Record<string, string> | undefined,
  ): Record<string, string> | undefined {
    if (!metadata) return undefined;
    if (Object.values(metadata).some((value) => typeof value !== 'string')) {
      throw new BadRequestException('payment.metadata chỉ nhận giá trị chuỗi');
    }
    return metadata;
  }

  private toTransactionMethod(
    method: string | undefined,
    fallback: PaymentMethod = PaymentMethod.CARD,
  ): PaymentMethod {
    switch (method) {
      case PaymentMethod.CARD:
      case PaymentMethod.GOOGLE_PAY:
      case PaymentMethod.APPLE_PAY:
      case PaymentMethod.BANK_TRANSFER:
      case PaymentMethod.WALLET:
      case PaymentMethod.QR:
      case PaymentMethod.PAYPAL:
      case PaymentMethod.TOKEN:
      case PaymentMethod.COD:
        return method;
      default:
        return fallback;
    }
  }

  private toPaymentTransactionStatus(status: string): TransactionStatus {
    if (status === 'captured') return TransactionStatus.SUCCESS;
    if (['declined', 'failed', 'cancelled'].includes(status)) {
      return TransactionStatus.FAILED;
    }
    return TransactionStatus.PENDING;
  }

  private toRefundTransactionStatus(status: string): TransactionStatus {
    if (status === 'succeeded') return TransactionStatus.SUCCESS;
    if (['failed', 'cancelled'].includes(status))
      return TransactionStatus.FAILED;
    return TransactionStatus.PENDING;
  }

  private formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  private defaultReturnUrl(): string {
    const frontendUrl =
      this.config.get<string>('app.frontendUrl') ?? 'http://localhost:4200';
    return `${frontendUrl.replace(/\/$/, '')}/payment/return`;
  }

  private returnUrlForOrder(url: string, orderId: string): string {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('orderId', orderId);
      return parsed.toString();
    } catch {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}orderId=${encodeURIComponent(orderId)}`;
    }
  }

  private notifyUrl(): string {
    const appUrl =
      this.config.get<string>('app.url') ?? 'http://localhost:3000';
    return `${appUrl.replace(/\/$/, '')}/payments/webhooks/comesh`;
  }

  private async findByIdOrThrow(orderId: string) {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return order;
  }

  private async restock(
    items: Array<{ productId: Types.ObjectId; quantity: number }>,
  ) {
    for (const item of items) {
      await this.productModel
        .updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } })
        .exec();
    }
  }
}
