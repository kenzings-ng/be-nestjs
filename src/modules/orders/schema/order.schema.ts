import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { DiscountType } from '../../promotions/schema/promotion.schema';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * A purchased line. Name and price are SNAPSHOTTED at checkout time so the
 * order stays historically accurate even if the product is later renamed,
 * repriced, or deleted. productId is kept only as a soft reference.
 */
@Schema({ _id: false })
export class OrderItem {
  // NOTE: dùng SchemaTypes.ObjectId (không phải Types.ObjectId) — chỉ SchemaTypes
  // mới khai báo path là ObjectId thật; Types.ObjectId khiến path thành Mixed
  // nên Mongoose không cast string sang ObjectId khi query.
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Product', required: true })
  productId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ required: true })
  subtotal!: number;
}
export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

/**
 * Mã giảm giá đã dùng, cũng được SNAPSHOT như OrderItem: nếu admin sửa hoặc xóa
 * mã sau này, đơn cũ vẫn giữ đúng điều kiện đã áp dụng. `code` còn được dùng để
 * đếm số lượt một user đã dùng mã (xem PromotionsService).
 */
@Schema({ _id: false })
export class OrderPromotion {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Promotion', required: true })
  promotionId!: Types.ObjectId;

  @Prop({ required: true })
  code!: string;

  @Prop({ type: String, enum: DiscountType, required: true })
  discountType!: DiscountType;

  @Prop({ required: true })
  discountValue!: number;

  /** Số tiền thực tế được giảm trên đơn này. */
  @Prop({ required: true })
  discountAmount!: number;
}
export const OrderPromotionSchema =
  SchemaFactory.createForClass(OrderPromotion);

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  items!: OrderItem[];

  /** Tổng tiền hàng trước khi trừ khuyến mãi. */
  @Prop({ required: true })
  subtotal!: number;

  /** Số tiền được giảm (0 nếu không dùng mã). */
  @Prop({ required: true, default: 0 })
  discount!: number;

  @Prop({ type: OrderPromotionSchema, required: false })
  promotion?: OrderPromotion;

  /** Số tiền phải trả = subtotal - discount. */
  @Prop({ required: true })
  totalPrice!: number;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
  status!: OrderStatus;

  @Prop()
  shippingAddress?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
