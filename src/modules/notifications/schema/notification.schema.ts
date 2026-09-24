import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schema/user.schema';
@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: User;
  @Prop({ required: true })
  title!: string;
  @Prop({ required: true })
  message!: string;
  @Prop({ type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' })
  type!: string;
  @Prop({ default: false })
  read!: boolean;
  @Prop()
  link?: string;
}
export const NotificationSchema = SchemaFactory.createForClass(Notification);
