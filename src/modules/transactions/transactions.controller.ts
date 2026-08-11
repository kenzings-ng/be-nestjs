import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@ApiBearerAuth('access-token')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // Admin: every payment/refund event across every order.
  @Get()
  @UseGuards(AdminGuard)
  findAll() {
    return this.transactionsService.findAll();
  }
}
