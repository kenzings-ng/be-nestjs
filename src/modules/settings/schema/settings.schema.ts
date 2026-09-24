import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
@Schema({ timestamps: true })
export class Setting extends Document {
  @Prop({ required: true, unique: true, index: true })
  key!: string;
  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  value!: any;
}
export const SettingSchema = SchemaFactory.createForClass(Setting);
