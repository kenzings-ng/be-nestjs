import { BadRequestException, Injectable } from '@nestjs/common';
import { ComeshGateway, ComeshPaymentRequest } from './gateways/comesh.gateway';
import {
  GlodiPayCardPaymentRequest,
  GlodiPayGateway,
  GlodiPayPaymentResponse,
} from './gateways/glodipay.gateway';
import { PaymentCredential } from './schema/payment-credential.schema';

/**
 * Provider registry. Add an adapter here when introducing another gateway;
 * payment credentials and checkout code do not need to be redesigned.
 */
@Injectable()
export class PaymentGatewaysService {
  constructor(
    private readonly comeshGateway: ComeshGateway,
    private readonly glodiPayGateway: GlodiPayGateway,
  ) {}

  createPayment(
    credential: PaymentCredential,
    request: ComeshPaymentRequest,
    idempotencyKey: string,
  ) {
    return this.comesh(credential).createPayment(
      credential,
      request,
      idempotencyKey,
    );
  }

  createGlodiPayCardPayment(
    credential: PaymentCredential,
    request: Omit<GlodiPayCardPaymentRequest, 'merchantId' | 'signature'>,
  ): Promise<GlodiPayPaymentResponse> {
    return this.glodiPay(credential).createCardPayment(credential, request);
  }

  assertSupported(credential: PaymentCredential) {
    if (this.comeshGateway.supports(credential.provider)) {
      this.comeshGateway.validateCredential(credential);
      return;
    }
    if (this.glodiPayGateway.supports(credential.provider)) {
      this.glodiPayGateway.validateCredential(credential);
      return;
    }
    throw new BadRequestException(
      `Chưa có adapter tích hợp cho provider: ${credential.provider}`,
    );
  }

  queryPayment(credential: PaymentCredential, paymentId: string) {
    return this.comesh(credential).queryPayment(credential, paymentId);
  }

  queryPaymentsByMerchantOrderNo(
    credential: PaymentCredential,
    merchantOrderNo: string,
  ) {
    return this.comesh(credential).queryPaymentsByMerchantOrderNo(
      credential,
      merchantOrderNo,
    );
  }

  createRefund(
    credential: PaymentCredential,
    request: {
      paymentId: string;
      merchantRefundNo: string;
      amount: { value: string; currency: string };
      reason?: string;
      metadata?: Record<string, string>;
    },
    idempotencyKey: string,
  ) {
    return this.comesh(credential).createRefund(
      credential,
      request,
      idempotencyKey,
    );
  }

  queryRefund(credential: PaymentCredential, refundId: string) {
    return this.comesh(credential).queryRefund(credential, refundId);
  }

  verifyWebhook(
    credential: PaymentCredential,
    timestamp: string | undefined,
    signature: string | undefined,
    rawBody: string,
  ) {
    return this.comesh(credential).verifyWebhook(
      credential,
      timestamp,
      signature,
      rawBody,
    );
  }

  verifyGlodiPayWebhook(
    credential: PaymentCredential,
    payload: Record<string, unknown>,
  ) {
    return this.glodiPay(credential).verifyWebhook(credential, payload);
  }

  private comesh(credential: PaymentCredential): ComeshGateway {
    if (!this.comeshGateway.supports(credential.provider)) {
      throw new BadRequestException(
        `Chưa có adapter tích hợp cho provider: ${credential.provider}`,
      );
    }
    return this.comeshGateway;
  }

  private glodiPay(credential: PaymentCredential): GlodiPayGateway {
    if (!this.glodiPayGateway.supports(credential.provider)) {
      throw new BadRequestException(
        `Chưa có adapter tích hợp cho provider: ${credential.provider}`,
      );
    }
    return this.glodiPayGateway;
  }
}
