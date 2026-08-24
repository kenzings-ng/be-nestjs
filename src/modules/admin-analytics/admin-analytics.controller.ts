import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import type { DashboardRange } from './admin-analytics.mapper';
import { AdminAnalyticsService } from './admin-analytics.service';

@ApiTags('admin analytics')
@ApiBearerAuth('access-token')
@Controller('admin/analytics')
@UseGuards(AdminGuard)
export class AdminAnalyticsController {
  constructor(private readonly analytics: AdminAnalyticsService) {}

  @Get('dashboard')
  getDashboard(@Query('range') range: DashboardRange = '12m') {
    return this.analytics.getDashboard(range);
  }

  @Get('customers')
  getCustomers() {
    return this.analytics.getCustomers();
  }

  @Get('customers/:id')
  getCustomer(@Param('id') id: string) {
    return this.analytics.getCustomer(id);
  }
}
