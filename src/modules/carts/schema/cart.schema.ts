import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

/**
 * A single line in a cart. Stores only a product reference + quantity —
 * price is intentionally NOT snapshotted here so the cart always reflects
 * the product's current price. Prices get frozen only when an Order is placed.
 */
@Schema({ _id: false })
export class CartItem {
  // NOTE: dùng SchemaTypes.ObjectId (không phải Types.ObjectId) — chỉ SchemaTypes
  // mới khai báo path là ObjectId thật; Types.ObjectId khiến path thành Mixed
  // nên Mongoose không cast string sang ObjectId khi query.
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Product', required: true })
  productId!: Types.ObjectId;

  // Variant picked for this line. Two lines with the same productId but a
  // different color/size are kept separate (not merged).
  @Prop({ required: false })
  color?: string;

  @Prop({ required: false })
  size?: string;

  @Prop({ required: true, min: 1 })
  quantity!: number;
}
export const CartItemSchema = SchemaFactory.createForClass(CartItem);

/**
 * One active cart per user (userId is unique).
 */
@Schema({ timestamps: true })
export class Cart extends Document {
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  userId!: Types.ObjectId;

  @Prop({ type: [CartItemSchema], default: [] })
  items!: CartItem[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);
