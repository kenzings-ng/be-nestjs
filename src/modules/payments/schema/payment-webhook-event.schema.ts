import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

/**
 * Provider event IDs are persisted to make webhook processing idempotent, as
 * required by the ComesH v3 documentation.
 */
@Schema({ timestamps: true })
export class PaymentWebhookEvent extends Document {
  @Prop({ required: true, unique: true })
  eventId!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  provider!: string;

  @Prop({ required: true })
  eventType!: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Transaction', required: false })
  transactionId?: Types.ObjectId;
}

export const PaymentWebhookEventSchema =
  SchemaFactory.createForClass(PaymentWebhookEvent);
