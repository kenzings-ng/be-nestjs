import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order, OrderSchema } from './schema/order.schema';
import { Product, ProductSchema } from '../products/schema/product.schema';
import { CartsModule } from '../carts/carts.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { PaymentsModule } from '../payments/payments.module';
import { User, UserSchema } from '../users/schema/user.schema';
import { PaymentWebhooksController } from './payment-webhooks.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      // Product is needed to validate stock and decrement it at checkout.
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
    ]),
    // Provides CartsService (read cart + clear cart on checkout).
    CartsModule,
    // Provides PromotionsService (validate + claim a coupon at checkout).
    PromotionsModule,
    // Provides TransactionsService (payment/refund records per order).
    TransactionsModule,
    // Credentials, adapter registry and webhook idempotency storage.
    PaymentsModule,
  ],
  controllers: [OrdersController, PaymentWebhooksController],
  providers: [OrdersService],
})
export class OrdersModule {}
