import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';
import { OnlinePaymentDto } from './dto/online-payment.dto';
import { RefundOrderDto } from './dto/refund-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/jwt-payload.type';

@ApiTags('orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Place an order from the current user's cart.
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  checkout(
    @CurrentUser('userId') userId: string,
    @Body() dto: CheckoutDto,
    @Req() request: Request,
  ) {
    return this.ordersService.checkout(userId, dto, {
      clientIp: request.ip,
      userAgent: request.get('user-agent'),
      acceptLanguage: request.get('accept-language'),
    });
  }

  // The current user's own orders.
  @Get()
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser('userId') userId: string) {
    return this.ordersService.findMine(userId);
  }

  // Admin: every order across all users. Declared before ':id' on purpose.
  @Get('admin/all')
  @UseGuards(AdminGuard)
  findAll() {
    return this.ordersService.findAll();
  }

  // A single order (owner or admin).
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ordersService.findOneForUser(id, user.userId, user.role);
  }

  // Customer return page can call this to reconcile a payment immediately;
  // the webhook remains the normal authoritative asynchronous confirmation.
  @Post(':id/payment-status')
  @UseGuards(JwtAuthGuard)
  refreshPaymentStatus(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ordersService.refreshPaymentStatus(id, user.userId, user.role);
  }

  @Post(':id/payment-retry')
  @UseGuards(JwtAuthGuard)
  retryPayment(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: OnlinePaymentDto,
    @Req() request: Request,
  ) {
    return this.ordersService.retryPayment(id, user.userId, user.role, dto, {
      clientIp: request.ip,
      userAgent: request.get('user-agent'),
      acceptLanguage: request.get('accept-language'),
    });
  }

  // Owner (or admin) cancels a pending order; stock is restored.
  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ordersService.cancel(id, user.userId, user.role);
  }

  // Admin: request a full or partial refund through the same gateway that
  // captured the original online payment.
  @Post(':id/refund')
  @UseGuards(AdminGuard)
  refund(@Param('id') id: string, @Body() dto: RefundOrderDto) {
    return this.ordersService.refund(id, dto);
  }

  // Admin: move an order to a new status.
  @Patch(':id/status')
  @UseGuards(AdminGuard)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto.status);
  }
}
