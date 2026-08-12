import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePaymentCredentialDto } from './dto/create-payment-credential.dto';
import { UpdatePaymentCredentialDto } from './dto/update-payment-credential.dto';
import { PaymentCredentialsService } from './payment-credentials.service';

@ApiTags('payment-credentials')
@ApiBearerAuth('access-token')
@Controller('payment-credentials')
export class PaymentCredentialsController {
  constructor(
    private readonly paymentCredentialsService: PaymentCredentialsService,
  ) {}

  /** Checkout may inspect enabled providers and capabilities, never secret keys. */
  @Get('available')
  @UseGuards(JwtAuthGuard)
  findAvailable() {
    return this.paymentCredentialsService.findAvailable();
  }

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() dto: CreatePaymentCredentialDto) {
    return this.paymentCredentialsService.create(dto);
  }

  @Get()
  @UseGuards(AdminGuard)
  findAll() {
    return this.paymentCredentialsService.findAllForAdmin();
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  findOne(@Param('id') id: string) {
    return this.paymentCredentialsService.findOneForAdmin(id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdatePaymentCredentialDto) {
    return this.paymentCredentialsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.paymentCredentialsService.remove(id);
  }
}
