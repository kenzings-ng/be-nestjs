import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';
import { Promotion, PromotionSchema } from './schema/promotion.schema';
import { Order, OrderSchema } from '../orders/schema/order.schema';
import { CartsModule } from '../carts/carts.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Promotion.name, schema: PromotionSchema },
      // Order chỉ dùng để đếm số lượt một user đã dùng mã (không tính đơn đã hủy).
      { name: Order.name, schema: OrderSchema },
    ]),
    // Provides CartsService — dùng cho endpoint xem trước mã trên giỏ hàng.
    CartsModule,
  ],
  controllers: [PromotionsController],
  providers: [PromotionsService],
  // OrdersModule dùng PromotionsService để áp mã lúc checkout.
  exports: [PromotionsService],
})
export class PromotionsModule {}
