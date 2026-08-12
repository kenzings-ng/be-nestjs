import { registerAs } from '@nestjs/config';
import { PaymentEnvironment } from '../modules/payments/payment.types';

/** The customer checkout environment. Webhooks continue to verify both. */
export default registerAs('payment', () => ({
  environment:
    process.env.PAYMENT_ENVIRONMENT === PaymentEnvironment.PRODUCTION ||
    process.env.NODE_ENV === 'production'
      ? PaymentEnvironment.PRODUCTION
      : PaymentEnvironment.SANDBOX,
  sandboxUrl: process.env.PAYMENT_SANDBOX_URL ?? 'https://payment-sandbox.comesh.xyz',
  productionUrl: process.env.PAYMENT_PRODUCTION_URL ?? 'https://payment.comesh.xyz',
}));
