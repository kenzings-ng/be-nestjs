import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

// No real payment gateway is wired up — this is a fixed set of mock methods
// used purely to label how a transaction was "settled" for display purposes.
export enum PaymentMethod {
  COD = 'cod',
  BANK_TRANSFER = 'bank_transfer',
}

/**
 * A payment-related event on an order (payment, refund...). One order can
 * have several — e.g. a `payment` recorded at checkout, then a `refund` if
 * the order is later cancelled.
 */
@Schema({ timestamps: true })
export class Transaction extends Document {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Order', required: true, index: true })
  orderId!: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: TransactionType, required: true })
  type!: TransactionType;

  @Prop({ type: String, enum: TransactionStatus, default: TransactionStatus.SUCCESS })
  status!: TransactionStatus;

  @Prop({ type: String, enum: PaymentMethod, default: PaymentMethod.COD })
  method!: PaymentMethod;

  @Prop({ required: true })
  amount!: number;

  // Mock gateway reference, simulating what a real payment provider returns.
  @Prop({ required: true, unique: true })
  reference!: string;

  @Prop()
  note?: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
