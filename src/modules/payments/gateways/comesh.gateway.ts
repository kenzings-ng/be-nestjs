import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, timingSafeEqual, randomUUID } from 'crypto';
import { PaymentEnvironment } from '../payment.types';
import { PaymentCredential } from '../schema/payment-credential.schema';

export interface ComeshAmount {
  value: string;
  currency: string;
}

export interface ComeshPaymentRequest {
  merchantOrderNo: string;
  order: {
    amount: ComeshAmount;
    placedAt: string;
    description?: string;
    items: Array<{
      sku: string;
      name: string;
      description?: string;
      unitPrice: ComeshAmount;
      quantity: number;
    }>;
  };
  customer: { email: string; phone?: string; ip: string };
  browser: {
    userAgent: string;
    acceptLanguage?: string;
    screenWidth?: number;
    screenHeight?: number;
    timeZoneOffset?: number;
  };
  billingAddress: ComeshAddress;
  shippingAddress?: ComeshAddress;
  paymentSource:
    | { type: 'checkout' }
    | {
        type: 'card';
        card: {
          number: string;
          holderName: string;
          expiryMonth: string;
          expiryYear: string;
          cvv: string;
        };
      }
    | { type: 'token'; token: { id: string } };
  callbacks: { returnUrl: string; notifyUrl: string };
  locale?: string;
  metadata?: Record<string, string>;
}

export interface ComeshAddress {
  name: string;
  email?: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
}

export interface ComeshPaymentData {
  paymentId: string;
  merchantOrderNo: string;
  status: string;
  amount: ComeshAmount;
  paymentMethod?: {
    type: string;
    card?: { firstSix?: string; lastFour?: string; brand?: string };
  };
  nextAction?:
    { type: 'redirect'; redirectUrl: string } | { type: 'html'; html: string };
  authorizationCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ComeshRefundData {
  refundId: string;
  paymentId: string;
  merchantRefundNo: string;
  status: string;
  amount: ComeshAmount;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ComeshPaymentRecordsData {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  payments: ComeshPaymentData[];
}

export interface ComeshEnvelope<T> {
  success: boolean;
  code: string;
  message: string;
  requestId?: string;
  data?: T;
  details?: Array<{ field: string; reason: string }>;
}

export interface ComeshWebhookEvent {
  eventId: string;
  eventType: 'payment.updated' | 'refund.updated';
  createdAt: string;
  data: ComeshPaymentData | ComeshRefundData;
}

interface ComeshCredentialKeys {
  app_key?: string;
  app_secret?: string;
  webhook_secret?: string;
  /** Backward-compatible aliases accepted by the admin form/API. */
  apiKey?: string;
  apiSecret?: string;
  webhookSecret?: string;
  baseUrl?: string;
}

/**
 * Comesh v3 adapter. It serializes a request once and signs that exact JSON
 * string, matching the documentation's raw-body HMAC requirement.
 */
@Injectable()
export class ComeshGateway {
  constructor(private readonly config?: ConfigService) {}

  supports(provider: string): boolean {
    return provider.toLowerCase() === 'comesh';
  }

  validateCredential(credential: PaymentCredential): void {
    const keys = this.getKeys(credential);
    if (!keys.app_key || !keys.app_secret || !keys.webhook_secret) {
      throw new BadRequestException(
        'Cấu hình Comesh cần keys.app_key, keys.app_secret và keys.webhook_secret',
      );
    }
  }

  async createPayment(
    credential: PaymentCredential,
    request: ComeshPaymentRequest,
    idempotencyKey: string = randomUUID(),
  ): Promise<ComeshEnvelope<ComeshPaymentData>> {
    return this.request<ComeshPaymentData>(credential, {
      method: 'POST',
      path: '/v3/payments',
      body: request,
      idempotencyKey,
    });
  }

  async queryPayment(
    credential: PaymentCredential,
    paymentId: string,
  ): Promise<ComeshEnvelope<ComeshPaymentData>> {
    return this.request<ComeshPaymentData>(credential, {
      method: 'GET',
      path: `/v3/payments/${encodeURIComponent(paymentId)}`,
    });
  }

  async queryPaymentsByMerchantOrderNo(
    credential: PaymentCredential,
    merchantOrderNo: string,
  ): Promise<ComeshEnvelope<ComeshPaymentRecordsData>> {
    return this.request<ComeshPaymentRecordsData>(credential, {
      method: 'GET',
      path: '/v3/payments',
      query: { merchantOrderNo, page: '1', pageSize: '1' },
    });
  }

  async createRefund(
    credential: PaymentCredential,
    request: {
      paymentId: string;
      merchantRefundNo: string;
      amount: ComeshAmount;
      reason?: string;
      metadata?: Record<string, string>;
    },
    idempotencyKey: string = randomUUID(),
  ): Promise<ComeshEnvelope<ComeshRefundData>> {
    return this.request<ComeshRefundData>(credential, {
      method: 'POST',
      path: '/v3/refunds',
      body: request,
      idempotencyKey,
    });
  }

  async queryRefund(
    credential: PaymentCredential,
    refundId: string,
  ): Promise<ComeshEnvelope<ComeshRefundData>> {
    return this.request<ComeshRefundData>(credential, {
      method: 'GET',
      path: `/v3/refunds/${encodeURIComponent(refundId)}`,
    });
  }

  /** Validates the signature documented as timestamp + '.' + exact raw body. */
  verifyWebhook(
    credential: PaymentCredential,
    timestamp: string | undefined,
    signature: string | undefined,
    rawBody: string,
  ): boolean {
    const webhookSecret = this.getKeys(credential).webhook_secret;
    if (!timestamp || !signature || !webhookSecret || !rawBody) return false;

    const expected = createHmac('sha256', webhookSecret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex');
    return secureEquals(expected, signature.trim());
  }

  private async request<T>(
    credential: PaymentCredential,
    options: {
      method: 'GET' | 'POST';
      path: string;
      body?: unknown;
      idempotencyKey?: string;
      query?: Record<string, string>;
    },
  ): Promise<ComeshEnvelope<T>> {
    const keys = this.getKeys(credential);
    this.validateCredential(credential);
    // validateCredential above guarantees both values are present.
    const apiKey = keys.app_key as string;
    const apiSecret = keys.app_secret as string;

    const rawBody =
      options.body === undefined ? '' : JSON.stringify(options.body);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createComeshRequestSignature(
      apiSecret,
      timestamp,
      options.method,
      options.path,
      rawBody,
    );
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      'X-Timestamp': timestamp,
      'X-Signature': `v1=${signature}`,
    };
    if (options.method === 'POST') {
      headers['Content-Type'] = 'application/json';
      headers['Idempotency-Key'] = options.idempotencyKey ?? randomUUID();
    }

    let response: Response;
    try {
      const search = options.query
        ? `?${new URLSearchParams(options.query).toString()}`
        : '';
      response = await fetch(
        `${this.getBaseUrl(credential)}${options.path}${search}`,
        {
          method: options.method,
          headers,
          body: options.method === 'POST' ? rawBody : undefined,
        },
      );
    } catch {
      // The order is retained as pending. The caller can safely reconcile it
      // because the same idempotency key is stored on its transaction.
      throw new BadGatewayException('Không thể kết nối đến cổng Comesh');
    }

    let payload: ComeshEnvelope<T> | undefined;
    try {
      payload = (await response.json()) as ComeshEnvelope<T>;
    } catch {
      throw new BadGatewayException('Comesh trả về dữ liệu không hợp lệ');
    }

    if (!response.ok && !payload) {
      throw new BadGatewayException('ComesH từ chối yêu cầu thanh toán');
    }
    return payload;
  }

  private getKeys(credential: PaymentCredential): ComeshCredentialKeys {
    const keys = credential.keys as ComeshCredentialKeys;
    return {
      ...keys,
      app_key: keys.app_key ?? keys.apiKey,
      app_secret: keys.app_secret ?? keys.apiSecret,
      webhook_secret: keys.webhook_secret ?? keys.webhookSecret,
    };
  }

  private getBaseUrl(credential: PaymentCredential): string {
    const configured = this.getKeys(credential).baseUrl;
    if (configured) return configured.replace(/\/$/, '');
    const configuredUrl = this.config?.get<string>(
      credential.environment === PaymentEnvironment.PRODUCTION
        ? 'payment.productionUrl'
        : 'payment.sandboxUrl',
    );
    if (!configuredUrl) {
      throw new BadRequestException(
        'Thiếu cấu hình PAYMENT_SANDBOX_URL/PAYMENT_PRODUCTION_URL',
      );
    }
    return configuredUrl.replace(/\/$/, '');
  }
}

/** Exported as a pure helper so signing can be regression-tested without HTTP. */
export function createComeshRequestSignature(
  apiSecret: string,
  timestamp: string,
  method: string,
  path: string,
  rawBody: string,
): string {
  const bodyHash = createHash('sha256').update(rawBody).digest('hex');
  const signingString = `${timestamp}.${method.toUpperCase()}.${path}.${bodyHash}`;
  return createHmac('sha256', apiSecret).update(signingString).digest('hex');
}

function secureEquals(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const actualBuffer = Buffer.from(actual, 'utf8');
  return (
    expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  );
}
