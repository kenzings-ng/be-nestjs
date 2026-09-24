import { generateKeyPairSync } from 'crypto';
import {
  canonicalizeGlodiPayPayload,
  generateGlodiPaySignature,
  GlodiPayGateway,
  verifyGlodiPaySignature,
} from './glodipay.gateway';
import { PaymentCredential } from '../schema/payment-credential.schema';
import { PaymentEnvironment } from '../payment.types';

describe('GlodiPayGateway', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  it('canonicalizes payload with forward slashes and unicode escaped', () => {
    const data = {
      orderRef: 'ORDER/001',
      description: 'Đơn hàng test',
      amount: 100,
      active: true,
      empty: '',
      nullVal: null,
      metadata: { key: 'value' },
    };
    const canonical = canonicalizeGlodiPayPayload(data);
    expect(canonical).toContain('ORDER\\/001');
    expect(canonical).toContain('\\u0110'); // escaped Đ
    expect(canonical).not.toContain('empty');
    expect(canonical).not.toContain('nullVal');
  });

  it('signs and verifies signature correctly with RSA-MD5', () => {
    const payload = {
      merchantId: '1100000123',
      orderRef: 'ORDER-2026-001',
      amount: 150.75,
      currency: 'USD',
      billingEmail: 'john@example.com',
    };

    const signature = generateGlodiPaySignature(payload, privateKey);
    expect(typeof signature).toBe('string');
    expect(signature.length).toBeGreaterThan(50);

    const verified = verifyGlodiPaySignature(payload, signature, publicKey);
    expect(verified).toBe(true);

    const tampered = { ...payload, amount: 200 };
    expect(verifyGlodiPaySignature(tampered, signature, publicKey)).toBe(false);
  });

  it('verifyWebhook validates signature on webhook payload', () => {
    const credential = {
      provider: 'glodipay',
      environment: PaymentEnvironment.SANDBOX,
      keys: {
        publicKey,
        privateKey,
        merchantId: '1100000123',
      },
    } as unknown as PaymentCredential;

    const gateway = new GlodiPayGateway();
    const webhookPayload = {
      merchantId: '1100000123',
      transactionId: '01jza90dy6w82dfrrqvadn5vs4',
      ref: 'ORDER-001',
      currency: 'USD',
      amount: 100,
      status: 'successful',
      statusCode: 6,
    };

    const signature = generateGlodiPaySignature(webhookPayload, privateKey);
    const signedPayload = {
      ...webhookPayload,
      signature,
    };

    expect(gateway.verifyWebhook(credential, signedPayload)).toBe(true);
    expect(
      gateway.verifyWebhook(credential, {
        ...signedPayload,
        status: 'failed',
      }),
    ).toBe(false);
  });
});
