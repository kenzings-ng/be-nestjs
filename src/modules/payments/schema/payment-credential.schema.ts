import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import {
  CardBrand,
  GatewayPaymentMethod,
  PaymentEnvironment,
} from '../payment.types';
import type { PaymentCredentialKeys } from '../payment.types';

/**
 * One merchant configuration for one provider/environment pair.
 *
 * `keys` is deliberately a JSON/Mixed field: every gateway uses a different
 * credential set. It is excluded from normal Mongoose queries and must never
 * be returned by an API response.
 */
@Schema({ timestamps: true, collection: 'paymentCredentials' })
export class PaymentCredential extends Document {
  /** Normalized gateway name, e.g. `comesh`, `stripe`, `paypal`. */
  @Prop({ required: true, lowercase: true, trim: true, index: true })
  provider!: string;

  @Prop({
    type: String,
    enum: PaymentEnvironment,
    required: true,
    default: PaymentEnvironment.SANDBOX,
  })
  environment!: PaymentEnvironment;

  /**
   * Provider-specific secret JSON. ComesH expects apiKey, apiSecret and
   * webhookSecret; baseUrl is optional and overrides the documented endpoint.
   */
  @Prop({ type: SchemaTypes.Mixed, required: true, select: false })
  keys!: PaymentCredentialKeys;

  /** Methods exposed to checkout, e.g. card, googlepay or applepay. */
  @Prop({ type: [String], enum: GatewayPaymentMethod, required: true })
  paymentMethods!: GatewayPaymentMethod[];

  /** Card brands accepted by this configuration, e.g. visa/mastercard. */
  @Prop({ type: [String], enum: CardBrand, default: [] })
  cardBrands!: CardBrand[];

  /** Currency sent to the provider for this configuration. */
  @Prop({ type: String, required: true, uppercase: true, default: 'USD' })
  currency!: string;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const PaymentCredentialSchema =
  SchemaFactory.createForClass(PaymentCredential);

// An environment can have only one active configuration per provider. MongoDB
// still allows a sandbox and a production configuration to coexist.
PaymentCredentialSchema.index(
  { provider: 1, environment: 1 },
  { unique: true },
);
