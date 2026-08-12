import {
  Body,
  BadRequestException,
  Controller,
  Header,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { OrdersService } from './orders.service';

type RawBodyRequest = Request & { rawBody?: Buffer };

@ApiTags('payment-webhooks')
@Controller('payments')
export class PaymentWebhooksController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * ComesH requires an exact raw request body for HMAC verification. This is
   * intentionally public and must not be protected by JWT.
   */
  @Post('webhooks/comesh')
  @HttpCode(200)
  @Header('Content-Type', 'text/plain')
  @ApiExcludeEndpoint()
  async comesh(
    @Req() request: RawBodyRequest,
    @Headers('x-webhook-timestamp') timestamp: string | undefined,
    @Headers('x-webhook-signature') signature: string | undefined,
    // This makes Nest parse JSON for normal framework behaviour, while the
    // verified value remains request.rawBody. It is never persisted.
    @Body() _body: unknown,
  ): Promise<string> {
    void _body;
    const rawBody = request.rawBody?.toString('utf8');
    if (!rawBody) {
      // With rawBody enabled in main.ts, an empty/missing raw value means this
      // request cannot be authenticated safely.
      throw new BadRequestException('Webhook raw body không tồn tại');
    }
    await this.ordersService.handleComeshWebhook(timestamp, signature, rawBody);
    return 'SUCCESS';
  }
}
