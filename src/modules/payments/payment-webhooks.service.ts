import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaymentWebhookEvent } from './schema/payment-webhook-event.schema';

@Injectable()
export class PaymentWebhooksService {
  constructor(
    @InjectModel(PaymentWebhookEvent.name)
    private readonly paymentWebhookEventModel: Model<PaymentWebhookEvent>,
  ) {}

  /** Returns false when this event was already processed. */
  async claim(
    eventId: string,
    provider: string,
    eventType: string,
  ): Promise<boolean> {
    try {
      await this.paymentWebhookEventModel.create({
        eventId,
        provider,
        eventType,
      });
      return true;
    } catch (error) {
      if (isDuplicateKeyError(error)) return false;
      throw error;
    }
  }

  async attachTransaction(eventId: string, transactionId: Types.ObjectId) {
    await this.paymentWebhookEventModel
      .updateOne({ eventId }, { transactionId })
      .exec();
  }

  /** Let the provider retry if business processing failed after claiming an event. */
  discard(eventId: string) {
    return this.paymentWebhookEventModel.deleteOne({ eventId }).exec();
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11000
  );
}
