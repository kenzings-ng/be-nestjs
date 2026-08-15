import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ComeshGateway } from './gateways/comesh.gateway';
import { PaymentCredentialsController } from './payment-credentials.controller';
import { PaymentCredentialsService } from './payment-credentials.service';
import { PaymentGatewaysService } from './payment-gateways.service';
import {
  PaymentCredential,
  PaymentCredentialSchema,
} from './schema/payment-credential.schema';
import {
  PaymentWebhookEvent,
  PaymentWebhookEventSchema,
} from './schema/payment-webhook-event.schema';
import { PaymentWebhooksService } from './payment-webhooks.service';
import {
  Transaction,
  TransactionSchema,
} from '../transactions/schema/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentCredential.name, schema: PaymentCredentialSchema },
      { name: PaymentWebhookEvent.name, schema: PaymentWebhookEventSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [PaymentCredentialsController],
  providers: [
    PaymentCredentialsService,
    PaymentWebhooksService,
    ComeshGateway,
    PaymentGatewaysService,
  ],
  exports: [
    PaymentCredentialsService,
    PaymentWebhooksService,
    PaymentGatewaysService,
  ],
})
export class PaymentsModule {}
