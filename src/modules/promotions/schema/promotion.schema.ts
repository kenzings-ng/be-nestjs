import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum DiscountType {
  /** Giảm theo phần trăm giá trị đơn hàng (discountValue = 1..100). */
  PERCENTAGE = 'percentage',
  /** Giảm thẳng một số tiền cố định (discountValue = số tiền). */
  FIXED = 'fixed',
}

/**
 * Mã giảm giá áp dụng ở bước checkout.
 *
 * Hiệu lực của một mã được quyết định bởi 4 nhóm điều kiện:
 *  - bật/tắt thủ công (isActive)
 *  - khoảng thời gian (startDate .. endDate)
 *  - số lượt dùng: tổng toàn hệ thống (usageLimit) và theo từng user (perUserLimit)
 *  - giá trị đơn hàng tối thiểu (minOrderValue)
 */
@Schema({ timestamps: true })
export class Promotion extends Document {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code!: string;

  @Prop()
  description?: string;

  @Prop({ type: String, enum: DiscountType, required: true })
  discountType!: DiscountType;

  /** Phần trăm (1..100) với `percentage`, hoặc số tiền giảm với `fixed`. */
  @Prop({ required: true, min: 0 })
  discountValue!: number;

  /** Trần số tiền được giảm, chỉ có ý nghĩa với `percentage`. Bỏ trống = không chặn trần. */
  @Prop({ min: 0 })
  maxDiscount?: number;

  /** Giá trị đơn hàng tối thiểu để mã được áp dụng. */
  @Prop({ default: 0, min: 0 })
  minOrderValue!: number;

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ required: true })
  endDate!: Date;

  /** Tổng số lượt dùng tối đa của mã. Bỏ trống = không giới hạn. */
  @Prop({ min: 1 })
  usageLimit?: number;

  /** Số lượt đã dùng — tăng khi đặt hàng thành công, giảm khi đơn bị hủy. */
  @Prop({ default: 0, min: 0 })
  usedCount!: number;

  /** Số lượt tối đa mỗi user được dùng. Bỏ trống = không giới hạn. */
  @Prop({ min: 1 })
  perUserLimit?: number;

  @Prop({ default: true })
  isActive!: boolean;
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);
