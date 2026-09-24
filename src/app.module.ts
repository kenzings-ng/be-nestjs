import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { configurations } from './config';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { ProductModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { OrdersModule } from './modules/orders/orders.module';
import { BrandsModule } from './modules/brands/brands.module';
import { CartsModule } from './modules/carts/carts.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { ContactModule } from './modules/contact/contact.module';
import { AdminAnalyticsModule } from './modules/admin-analytics/admin-analytics.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLogInterceptor } from './modules/audit-log/audit-log.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: configurations }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('database.uri'),
      }),
    }),
    ProductModule,
    AuthModule,
    UploadsModule,
    CategoriesModule,
    OrdersModule,
    BrandsModule,
    CartsModule,
    PromotionsModule,
    ContactModule,
    AdminAnalyticsModule,
    AuditLogModule,
    SettingsModule,
    NotificationsModule,
    ArticlesModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ]
})
export class AppModule {}
