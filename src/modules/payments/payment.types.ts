/**
 * The customer-facing payment methods a gateway can advertise.  This is kept
 * independent from a provider's transport (for example, ComesH's
 * `paymentSource.type`) so a hosted checkout can still advertise `card`.
 */
export enum GatewayPaymentMethod {
  CARD = 'card',
  GOOGLE_PAY = 'googlepay',
  APPLE_PAY = 'applepay',
  BANK_TRANSFER = 'bank_transfer',
  WALLET = 'wallet',
  QR = 'qr',
  PAYPAL = 'paypal',
}

/** Card networks supported by a configured payment gateway. */
export enum CardBrand {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  AMERICAN_EXPRESS = 'amex',
  JCB = 'jcb',
  DISCOVER = 'discover',
  DINERS_CLUB = 'diners_club',
  UNIONPAY = 'unionpay',
}

export enum PaymentEnvironment {
  SANDBOX = 'sandbox',
  PRODUCTION = 'production',
}

export interface PaymentCredentialKeys {
  /** Provider-specific credential values, e.g. apiKey, apiSecret and webhookSecret. */
  [key: string]: string;
}
