import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

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

  @Prop({ required: false })
  imageUrl?: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: false, default: 0 })
  salePrice?: number;

  @Prop({ default: 0 })
  stock!: number;

  @Prop()
  description?: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
