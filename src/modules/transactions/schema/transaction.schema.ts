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

export enum PaymentMethod {
  COD = 'cod',
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card',
  GOOGLE_PAY = 'googlepay',
  APPLE_PAY = 'applepay',
  WALLET = 'wallet',
  QR = 'qr',
  PAYPAL = 'paypal',
  TOKEN = 'token',
}

/**
 * A payment-related event on an order (payment, refund...). One order can
 * have several — e.g. a pending gateway payment followed by a refund.
 */
@Schema({ timestamps: true })
export class Transaction extends Document {
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'Order',
    required: true,
    index: true,
  })
  orderId!: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: TransactionType, required: true })
  type!: TransactionType;

  @Prop({
    type: String,
    enum: TransactionStatus,
    default: TransactionStatus.SUCCESS,
  })
  status!: TransactionStatus;

  @Prop({ type: String, enum: PaymentMethod, default: PaymentMethod.COD })
  method!: PaymentMethod;

  @Prop({ required: true })
  amount!: number;

  /** ISO 4217 currency snapshot used when the gateway transaction was created. */
  @Prop({ uppercase: true, trim: true })
  currency?: string;

  /** Internal immutable reference, also useful in staff-facing reconciliation. */
  @Prop({ required: true, unique: true })
  reference!: string;

  /** Gateway/provider name, e.g. `comesh`. Empty for COD/manual records. */
  @Prop({ lowercase: true, trim: true, index: true })
  provider?: string;

  /** Exact credential used; allows sandbox and production to coexist safely. */
  @Prop({ type: SchemaTypes.ObjectId, ref: 'PaymentCredential', index: true })
  paymentCredentialId?: Types.ObjectId;

  /** The merchant order/refund number sent to the provider. */
  @Prop({ index: true })
  merchantReference?: string;

  /** Provider payment ID returned by ComesH (`pay_...`). */
  @Prop({ unique: true, sparse: true, index: true })
  gatewayPaymentId?: string;

  /** Provider refund ID returned by ComesH (`ref_...`). */
  @Prop({ unique: true, sparse: true, index: true })
  gatewayRefundId?: string;

  /** Last raw status received from the provider, e.g. requiresAction/captured. */
  @Prop()
  providerStatus?: string;

  /** Safe card metadata returned by the provider. Raw PAN/CVV are never stored. */
  @Prop()
  cardBrand?: string;

  @Prop()
  cardLastFour?: string;

  /** Reused on retries so provider POSTs remain idempotent. */
  @Prop({ select: false })
  idempotencyKey?: string;

  @Prop()
  note?: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
