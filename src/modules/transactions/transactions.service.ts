import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';
import {
  PaymentMethod,
  Transaction,
  TransactionStatus,
  TransactionType,
} from './schema/transaction.schema';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
  ) {}

  /** Records one payment/refund event. */
  record(params: {
    orderId: Types.ObjectId;
    userId: Types.ObjectId;
    type: TransactionType;
    amount: number;
    currency?: string;
    method?: PaymentMethod;
    status?: TransactionStatus;
    note?: string;
    provider?: string;
    paymentCredentialId?: Types.ObjectId;
    merchantReference?: string;
    gatewayPaymentId?: string;
    gatewayRefundId?: string;
    providerStatus?: string;
    cardBrand?: string;
    cardLastFour?: string;
    idempotencyKey?: string;
  }): Promise<Transaction> {
    return this.transactionModel.create({
      orderId: params.orderId,
      userId: params.userId,
      type: params.type,
      amount: params.amount,
      currency: params.currency,
      method: params.method ?? PaymentMethod.COD,
      status: params.status ?? TransactionStatus.SUCCESS,
      note: params.note,
      provider: params.provider,
      paymentCredentialId: params.paymentCredentialId,
      merchantReference: params.merchantReference,
      gatewayPaymentId: params.gatewayPaymentId,
      gatewayRefundId: params.gatewayRefundId,
      providerStatus: params.providerStatus,
      cardBrand: params.cardBrand,
      cardLastFour: params.cardLastFour,
      idempotencyKey: params.idempotencyKey,
      reference: this.generateReference(params.type),
    });
  }

  async updateGatewayPayment(
    transactionId: Types.ObjectId,
    data: {
      gatewayPaymentId?: string;
      providerStatus: string;
      status: TransactionStatus;
      method?: PaymentMethod;
      cardBrand?: string;
      cardLastFour?: string;
      note?: string;
    },
  ): Promise<Transaction> {
    const transaction = await this.transactionModel
      .findById(transactionId)
      .exec();
    if (!transaction) throw new Error('Transaction không tồn tại');

    if (data.gatewayPaymentId !== undefined) {
      transaction.gatewayPaymentId = data.gatewayPaymentId;
    }
    transaction.providerStatus = data.providerStatus;
    transaction.status = data.status;
    if (data.method !== undefined) transaction.method = data.method;
    if (data.cardBrand !== undefined) transaction.cardBrand = data.cardBrand;
    if (data.cardLastFour !== undefined)
      transaction.cardLastFour = data.cardLastFour;
    if (data.note !== undefined) transaction.note = data.note;
    await transaction.save();
    return transaction;
  }

  async updateGatewayRefund(
    transactionId: Types.ObjectId,
    data: {
      gatewayRefundId?: string;
      providerStatus: string;
      status: TransactionStatus;
      note?: string;
    },
  ): Promise<Transaction> {
    const transaction = await this.transactionModel
      .findById(transactionId)
      .exec();
    if (!transaction) throw new Error('Transaction không tồn tại');

    if (data.gatewayRefundId !== undefined) {
      transaction.gatewayRefundId = data.gatewayRefundId;
    }
    transaction.providerStatus = data.providerStatus;
    transaction.status = data.status;
    if (data.note !== undefined) transaction.note = data.note;
    await transaction.save();
    return transaction;
  }

  findGatewayPayment(orderId: Types.ObjectId): Promise<Transaction | null> {
    return this.transactionModel
      .findOne({
        orderId,
        type: TransactionType.PAYMENT,
        provider: { $exists: true },
        gatewayPaymentId: { $exists: true },
      })
      .sort({ createdAt: -1 })
      .select('+idempotencyKey')
      .exec();
  }

  findOnlinePayment(orderId: Types.ObjectId): Promise<Transaction | null> {
    return this.transactionModel
      .findOne({
        orderId,
        type: TransactionType.PAYMENT,
        provider: { $exists: true },
      })
      .sort({ createdAt: -1 })
      .select('+idempotencyKey')
      .exec();
  }

  findGatewayPaymentById(
    provider: string,
    gatewayPaymentId: string,
  ): Promise<Transaction | null> {
    return this.transactionModel
      .findOne({
        provider: provider.toLowerCase(),
        gatewayPaymentId,
        type: TransactionType.PAYMENT,
      })
      .exec();
  }

  findGatewayRefundById(
    provider: string,
    gatewayRefundId: string,
  ): Promise<Transaction | null> {
    return this.transactionModel
      .findOne({
        provider: provider.toLowerCase(),
        gatewayRefundId,
        type: TransactionType.REFUND,
      })
      .exec();
  }

  async reservedRefundAmount(orderId: Types.ObjectId): Promise<number> {
    const result = await this.transactionModel.aggregate<{
      total: number;
    }>([
      {
        $match: {
          orderId,
          type: TransactionType.REFUND,
          provider: { $exists: true },
          status: {
            $in: [TransactionStatus.PENDING, TransactionStatus.SUCCESS],
          },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total ?? 0;
  }

  /** All transactions for one order, oldest first (payment, then refund...). */
  findByOrder(orderId: Types.ObjectId): Promise<Transaction[]> {
    return this.transactionModel
      .find({ orderId })
      .sort({ createdAt: 1 })
      .exec();
  }

  /** Admin: every transaction across every order, newest first. */
  findAll(): Promise<Transaction[]> {
    return this.transactionModel
      .find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('orderId', 'totalPrice status')
      .exec();
  }

  private generateReference(type: TransactionType): string {
    const prefix = type === TransactionType.REFUND ? 'RFD' : 'TXN';
    return `${prefix}-${randomBytes(5).toString('hex').toUpperCase()}`;
  }
}
