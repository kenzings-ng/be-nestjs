import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ _id: false })
export class ProductColor {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  hex!: string;
}
export const ProductColorSchema = SchemaFactory.createForClass(ProductColor);

@Schema({ timestamps: true })
export class Product extends Document {
  // NOTE: dùng SchemaTypes.ObjectId (không phải Types.ObjectId) — chỉ SchemaTypes
  // mới khai báo path là ObjectId thật; Types.ObjectId khiến path thành Mixed
  // nên Mongoose không cast string sang ObjectId khi query.
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Category', required: false })
  categoryId?: Types.ObjectId;

  @Prop({ required: true, unique: true })
  slug!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({ required: true })
  price!: number;

  // Original ("was") price shown struck through when the product is on sale.
  // Must be greater than `price` to actually read as a discount.
  @Prop({ required: false })
  compareAtPrice?: number;

  // NOTE: named `newArrival`, not `isNew` — `isNew` collides with a built-in
  // Mongoose Document property (tracks whether the doc has been saved yet).
  @Prop({ default: false })
  newArrival!: boolean;

  @Prop({ default: 0 })
  stock!: number;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  details!: string[];

  @Prop({ type: [ProductColorSchema], default: [] })
  colors!: ProductColor[];

  @Prop({ type: [String], default: [] })
  sizes!: string[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
