import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createSign, createVerify } from 'crypto';
import { PaymentEnvironment } from '../payment.types';
import { PaymentCredential } from '../schema/payment-credential.schema';

export interface GlodiPayAmount {
  value: string;
  currency: string;
}

export interface GlodiPayBrowserDetails {
  accept_header: string;
  screen_width: string;
  screen_height: string;
  screen_color_depth: string;
  window_width: string;
  window_height: string;
  language: string;
  java_enabled: string;
  user_agent: string;
  time_zone: string;
  time_zone_name: string;
  languages?: string[];
  platform?: string;
  cookieEnabled?: boolean;
  online?: boolean;
  hardwareConcurrency?: number;
  deviceMemory?: number | string;
  availWidth?: number;
  availHeight?: number;
  currentUrl?: string;
  hostname?: string;
}

export interface GlodiPayCardPaymentRequest {
  merchantId: string;
  orderRef: string;
  amount: number;
  currency: string;
  paymentMethod: 'card';
  callbackUrl: string;
  notificationUrl: string;
  cancelUrl: string;
  errorUrl: string;
  cardNumber: string;
  cardMonth: string;
  cardYear: string;
  cardSecurityCode: string;
  billingFirstName: string;
  billingLastName: string;
  billingEmail: string;
  billingStreet1: string;
  billingStreet2?: string;
  billingCity: string;
  billingState?: string;
  billingCountry: string;
  billingPostalCode: string;
  billingPhoneCountryCode?: string;
  billingPhoneNumber: string;
  customerIp: string;
  orderDescription: string;
  metadata?: Record<string, unknown>;
  transactionDocuments?: unknown;
  feeBySeller?: number;
  websiteUrl?: string;
  expiresAt?: string;
  browserDetails: GlodiPayBrowserDetails | string;
  signature?: string;
}

export interface GlodiPayPaymentResponse {
  status: 'success' | 'redirect' | 'pending' | 'error';
  message: string;
  data?: {
    transactionId: string;
    url?: string;
  };
  errors?: Array<{
    field: string;
    message: string[];
  }>;
}

export interface GlodiPayIpnPayload {
  merchantId: string;
  transactionId: string;
  transactionNumber?: string;
  ref: string;
  currency: string;
  amount: number;
  paidAmount?: number;
  settlementAmount?: number;
  estimationSettlementAt?: string;
  fees?: {
    buyer?: number;
    seller?: number;
    rolling?: number;
    operate?: number;
    estimationRollingReleaseAt?: string;
  };
  status: string;
  statusCode: number;
  metadata?: Record<string, unknown>;
  transactionDocuments?: unknown;
  paymentMethodDetails?: {
    displayName?: string;
    group?: string;
    family?: string;
    type?: string;
    card?: {
      name?: string;
      firstSixDigits?: string;
      lastFourDigits?: string;
      expiryMonth?: string;
      expiryYear?: string;
      type?: string;
      issuer?: string;
      issuerCountryCode?: string;
      funding?: string;
      authorizationCode?: string;
      clientIP?: string;
    };
  };
  message?: string | null;
  descriptor?: string;
  transactionCreatedAt?: string;
  originalTransactionCreatedAt?: string;
  signature: string;
}

export interface GlodiPayCredentialKeys {
  merchantId?: string;
  merchant_id?: string;
  privateKey?: string;
  private_key?: string;
  publicKey?: string;
  public_key?: string;
  baseUrl?: string;
  base_url?: string;
}

@Injectable()
export class GlodiPayGateway {
  constructor(private readonly config?: ConfigService) {}

  supports(provider: string): boolean {
    return provider.toLowerCase() === 'glodipay';
  }

  validateCredential(credential: PaymentCredential): void {
    const keys = this.getKeys(credential);
    if (!keys.merchantId || !keys.privateKey) {
      throw new BadRequestException(
        'Cấu hình GlodiPay cần keys.merchantId và keys.privateKey (RSA Private Key)',
      );
    }
  }

  async createCardPayment(
    credential: PaymentCredential,
    payload: Omit<GlodiPayCardPaymentRequest, 'merchantId' | 'signature'>,
  ): Promise<GlodiPayPaymentResponse> {
    const keys = this.getKeys(credential);
    this.validateCredential(credential);

    const fullPayload: GlodiPayCardPaymentRequest = {
      ...payload,
      merchantId: keys.merchantId!,
    };

    const signature = generateGlodiPaySignature(
      fullPayload as unknown as Record<string, unknown>,
      keys.privateKey!,
    );
    fullPayload.signature = signature;

    const baseUrl = this.getBaseUrl(credential);
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/v2/card/api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullPayload),
      });
    } catch {
      throw new BadGatewayException('Không thể kết nối đến cổng GlodiPay');
    }

    let result: GlodiPayPaymentResponse | undefined;
    try {
      result = (await response.json()) as GlodiPayPaymentResponse;
    } catch {
      throw new BadGatewayException('GlodiPay trả về dữ liệu không hợp lệ');
    }

    if (!response.ok && !result) {
      throw new BadGatewayException('GlodiPay từ chối yêu cầu thanh toán');
    }

    return result;
  }

  verifyWebhook(
    credential: PaymentCredential,
    payload: Record<string, unknown>,
  ): boolean {
    const keys = this.getKeys(credential);
    const publicKey = keys.publicKey;
    if (!publicKey || !payload || typeof payload !== 'object') {
      return false;
    }

    const signature = payload.signature;
    if (typeof signature !== 'string' || !signature.trim()) {
      return false;
    }

    return verifyGlodiPaySignature(payload, signature.trim(), publicKey);
  }

  getKeys(credential: PaymentCredential): GlodiPayCredentialKeys {
    const keys = (credential.keys ?? {}) as GlodiPayCredentialKeys;
    return {
      merchantId: keys.merchantId ?? keys.merchant_id,
      privateKey: keys.privateKey ?? keys.private_key,
      publicKey: keys.publicKey ?? keys.public_key,
      baseUrl: keys.baseUrl ?? keys.base_url,
    };
  }

  getBaseUrl(credential: PaymentCredential): string {
    const configured = this.getKeys(credential).baseUrl;
    if (configured) return configured.replace(/\/$/, '');

    const env = credential.environment;
    const configuredUrl = this.config?.get<string>(
      env === PaymentEnvironment.PRODUCTION
        ? 'payment.glodipayProductionUrl'
        : 'payment.glodipaySandboxUrl',
    );
    if (configuredUrl) return configuredUrl.replace(/\/$/, '');

    return env === PaymentEnvironment.PRODUCTION
      ? 'https://payment.gpayprocessing.com'
      : 'https://payment-sandbox.gpayprocessing.com';
  }
}

export function phpCast(v: unknown): unknown {
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? '1' : '';
  if (typeof v === 'string') return v.trim();
  if (Array.isArray(v)) return v.map(phpCast);
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, val]) => [
        k,
        phpCast(val),
      ]),
    );
  }
  return v;
}

export function canonicalizeGlodiPayPayload(
  data: Record<string, unknown>,
): string {
  const sorted: Record<string, unknown> = {};

  Object.keys(data)
    .filter(
      (k) =>
        k !== 'signature' &&
        data[k] !== '' &&
        data[k] !== null &&
        data[k] !== undefined,
    )
    .sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
    )
    .forEach((k) => {
      let val = data[k];
      if (typeof val === 'object' && val !== null) {
        val = JSON.stringify(val);
      }
      sorted[k] = val;
    });

  return JSON.stringify(phpCast(sorted))
    .replace(/\//g, '\\/')
    .replace(
      /[\u0080-\uffff]/g,
      (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'),
    );
}

export function generateGlodiPaySignature(
  data: Record<string, unknown>,
  privateKey: string,
): string {
  const canonical = canonicalizeGlodiPayPayload(data);
  const sign = createSign('md5WithRSAEncryption');
  sign.update(canonical);
  return sign.sign(privateKey, 'base64');
}

export function verifyGlodiPaySignature(
  data: Record<string, unknown>,
  signature: string,
  publicKey: string,
): boolean {
  try {
    const canonical = canonicalizeGlodiPayPayload(data);
    const verify = createVerify('md5WithRSAEncryption');
    verify.update(canonical);
    return verify.verify(publicKey, signature, 'base64');
  } catch {
    return false;
  }
}
