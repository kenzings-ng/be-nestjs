import { createHmac } from 'crypto';
import { ComeshGateway, createComeshRequestSignature } from './comesh.gateway';
import { PaymentCredential } from '../schema/payment-credential.schema';

describe('ComeshGateway', () => {
  it('builds the v3 request signature from the exact raw body', () => {
    expect(
      createComeshRequestSignature(
        'test_secret_123',
        '1781000000',
        'POST',
        '/v3/payments',
        '{"merchantOrderNo":"ORDER-10001"}',
      ),
    ).toBe('a2a3629fe8fdc6d5361f3f9704d8dc4db0c7ccab6f30ac1a7a59ea0608f0b226');
  });

  it('accepts only a webhook signature for the original raw bytes', () => {
    const rawBody = '{"eventId":"evt_1","eventType":"payment.updated"}';
    const timestamp = '1781000000';
    const signature = createHmac('sha256', 'webhook_secret')
      .update(`${timestamp}.${rawBody}`)
      .digest('hex');
    const credential = {
      keys: { webhookSecret: 'webhook_secret' },
    } as unknown as PaymentCredential;
    const gateway = new ComeshGateway();

    expect(
      gateway.verifyWebhook(credential, timestamp, signature, rawBody),
    ).toBe(true);
    expect(
      gateway.verifyWebhook(
        credential,
        timestamp,
        signature,
        '{"eventType":"payment.updated","eventId":"evt_1"}',
      ),
    ).toBe(false);
  });
});
