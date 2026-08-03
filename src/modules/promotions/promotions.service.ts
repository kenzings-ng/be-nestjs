import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderStatus } from '../orders/schema/order.schema';
import { CartsService } from '../carts/carts.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { DiscountType, Promotion } from './schema/promotion.schema';

/** Kết quả kiểm tra một mã trên một giá trị đơn hàng cụ thể. */
export interface PromotionCheck {
  promotion: Promotion;
  subtotal: number;
  discount: number;
  total: number;
}

/** Dạng rút gọn trả về cho client khi xem trước mã. */
export interface PromotionPreview {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  subtotal: number;
  discount: number;
  total: number;
}

@Injectable()
export class PromotionsService {
  constructor(
    @InjectModel(Promotion.name)
    private readonly promotionModel: Model<Promotion>,
    // Lượt dùng theo từng user được suy ra từ các đơn đã đặt (đơn hủy không tính).
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    private readonly cartsService: CartsService,
  ) {}

  // ---- Admin CRUD ----

  async create(dto: CreatePromotionDto) {
    this.assertConsistent(dto.discountType, dto.discountValue, {
      startDate: dto.startDate,
      endDate: dto.endDate,
    });

    const existing = await this.promotionModel
      .findOne({ code: dto.code })
      .exec();
    if (existing) {
      throw new ConflictException(`Mã "${dto.code}" đã tồn tại`);
    }

    return this.promotionModel.create({
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
    });
  }

  /** Toàn bộ mã, mới nhất trước (admin). */
  findAll() {
    return this.promotionModel.find().sort({ createdAt: -1 }).exec();
  }

  /** Các mã đang còn hiệu lực (còn hạn và còn lượt) để hiển thị cho người mua. */
  findActive() {
    const now = new Date();
    return this.promotionModel
      .find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
        // `usageLimit: null` khớp cả trường hợp field không tồn tại = không giới hạn.
        $or: [
          { usageLimit: null },
          { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
        ],
      })
      .sort({ endDate: 1 })
      .exec();
  }

  async findOne(id: string) {
    return this.findByIdOrThrow(id);
  }

  async update(id: string, dto: UpdatePromotionDto) {
    const promotion = await this.findByIdOrThrow(id);

    // Kiểm tra trên giá trị SAU khi merge, vì dto có thể chỉ đổi một nửa cặp
    // (vd chỉ đổi discountType mà giữ nguyên discountValue).
    const discountType = dto.discountType ?? promotion.discountType;
    const discountValue = dto.discountValue ?? promotion.discountValue;
    this.assertConsistent(discountType, discountValue, {
      startDate: dto.startDate ?? promotion.startDate,
      endDate: dto.endDate ?? promotion.endDate,
    });

    if (dto.code && dto.code !== promotion.code) {
      const clash = await this.promotionModel
        .findOne({ code: dto.code, _id: { $ne: promotion._id } })
        .exec();
      if (clash) {
        throw new ConflictException(`Mã "${dto.code}" đã tồn tại`);
      }
    }

    Object.assign(promotion, {
      ...dto,
      ...(dto.startDate ? { startDate: new Date(dto.startDate) } : {}),
      ...(dto.endDate ? { endDate: new Date(dto.endDate) } : {}),
    });
    await promotion.save();
    return promotion;
  }

  async remove(id: string) {
    const promotion = await this.findByIdOrThrow(id);
    await promotion.deleteOne();
    return { deleted: true, id };
  }

  // ---- Áp dụng ----

  /**
   * Kiểm tra mã trên một giá trị đơn hàng và trả về số tiền được giảm.
   * Ném lỗi nếu mã không dùng được — gọi ở cả bước xem trước lẫn checkout.
   */
  async validateForOrder(
    code: string,
    userId: string,
    subtotal: number,
  ): Promise<PromotionCheck> {
    const promotion = await this.promotionModel
      .findOne({ code: code.trim().toUpperCase() })
      .exec();
    if (!promotion) {
      throw new NotFoundException('Mã giảm giá không tồn tại');
    }
    if (!promotion.isActive) {
      throw new BadRequestException('Mã giảm giá đã bị vô hiệu hóa');
    }

    const now = new Date();
    if (now < promotion.startDate) {
      throw new BadRequestException('Mã giảm giá chưa đến thời gian áp dụng');
    }
    if (now > promotion.endDate) {
      throw new BadRequestException('Mã giảm giá đã hết hạn');
    }
    if (subtotal < promotion.minOrderValue) {
      throw new BadRequestException(
        `Đơn hàng phải từ ${promotion.minOrderValue} mới dùng được mã này`,
      );
    }
    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      throw new ConflictException('Mã giảm giá đã hết lượt sử dụng');
    }
    if (promotion.perUserLimit) {
      const used = await this.countUserUsage(promotion.code, userId);
      if (used >= promotion.perUserLimit) {
        throw new ConflictException('Bạn đã dùng hết lượt cho mã giảm giá này');
      }
    }

    const discount = this.calculateDiscount(promotion, subtotal);
    return { promotion, subtotal, discount, total: subtotal - discount };
  }

  /** Xem trước mã trên giỏ hàng hiện tại của user (không tiêu tốn lượt dùng). */
  async previewForCart(
    userId: string,
    code: string,
  ): Promise<PromotionPreview> {
    const cart = await this.cartsService.getMyCart(userId);
    if (cart.items.length === 0) {
      throw new BadRequestException('Giỏ hàng đang trống');
    }

    const { promotion, subtotal, discount, total } =
      await this.validateForOrder(code, userId, cart.totalPrice);
    return {
      code: promotion.code,
      description: promotion.description,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      subtotal,
      discount,
      total,
    };
  }

  /**
   * Trừ một lượt dùng. Điều kiện `usedCount < usageLimit` nằm ngay trong query
   * nên hai đơn đặt cùng lúc không thể vượt quá hạn mức.
   */
  async consume(promotionId: Types.ObjectId) {
    const updated = await this.promotionModel
      .findOneAndUpdate(
        {
          _id: promotionId,
          $or: [
            { usageLimit: null },
            { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
          ],
        },
        { $inc: { usedCount: 1 } },
        { new: true },
      )
      .exec();
    if (!updated) {
      throw new ConflictException('Mã giảm giá vừa hết lượt sử dụng');
    }
    return updated;
  }

  /** Hoàn lại lượt dùng khi đơn bị hủy hoặc khi checkout thất bại giữa chừng. */
  async release(promotionId: Types.ObjectId) {
    await this.promotionModel
      .updateOne(
        { _id: promotionId, usedCount: { $gt: 0 } },
        { $inc: { usedCount: -1 } },
      )
      .exec();
  }

  /** Số tiền được giảm, đã chặn trần và không bao giờ vượt quá giá trị đơn. */
  calculateDiscount(promotion: Promotion, subtotal: number): number {
    let discount =
      promotion.discountType === DiscountType.PERCENTAGE
        ? (subtotal * promotion.discountValue) / 100
        : promotion.discountValue;

    if (
      promotion.discountType === DiscountType.PERCENTAGE &&
      promotion.maxDiscount
    ) {
      discount = Math.min(discount, promotion.maxDiscount);
    }
    return Math.min(Math.round(discount), subtotal);
  }

  // ---- helpers ----

  private async findByIdOrThrow(id: string) {
    const promotion = await this.promotionModel.findById(id).exec();
    if (!promotion) {
      throw new NotFoundException('Không tìm thấy mã giảm giá');
    }
    return promotion;
  }

  /** Đơn đã hủy không tính vào hạn mức, lượt dùng được trả lại cho user. */
  private countUserUsage(code: string, userId: string) {
    return this.orderModel
      .countDocuments({
        userId: new Types.ObjectId(userId),
        'promotion.code': code,
        status: { $ne: OrderStatus.CANCELLED },
      })
      .exec();
  }

  private assertConsistent(
    discountType: DiscountType,
    discountValue: number,
    range: { startDate: string | Date; endDate: string | Date },
  ) {
    if (discountType === DiscountType.PERCENTAGE && discountValue > 100) {
      throw new BadRequestException(
        'Giảm giá theo phần trăm không được vượt quá 100',
      );
    }
    if (new Date(range.endDate) <= new Date(range.startDate)) {
      throw new BadRequestException('endDate phải sau startDate');
    }
  }
}
