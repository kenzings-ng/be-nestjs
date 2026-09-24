import { Controller, Get, Param, Query, UseGuards, Res, Header } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AdminGuard } from '../auth/guards/admin.guard';
import type { DashboardRange } from './admin-analytics.mapper';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminAnalyticsExportService } from './admin-analytics-export.service';

@ApiTags('admin analytics')
@ApiBearerAuth('access-token')
@Controller('admin/analytics')
@UseGuards(AdminGuard)
export class AdminAnalyticsController {
  constructor(
    private readonly analyticsService: AdminAnalyticsService,
    private readonly exportService: AdminAnalyticsExportService,
  ) {}

  @Get('dashboard')
  getDashboard(@Query('range') range: DashboardRange = '12m') {
    return this.analyticsService.getDashboard(range);
  }

  @Get('customers')
  getCustomers() {
    return this.analyticsService.getCustomers();
  }

  @Get('customers/:id')
  getCustomer(@Param('id') id: string) {
    return this.analyticsService.getCustomer(id);
  }

  @Get('export/excel')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename="dashboard-report.xlsx"')
  async exportExcel(@Res() res: Response) {
    const stats = await this.analyticsService.getDashboard();
    const buffer = await this.exportService.exportDashboardExcel(stats);
    res.send(buffer);
  }

  @Get('export/pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="dashboard-report.pdf"')
  async exportPdf(@Res() res: Response) {
    const stats = await this.analyticsService.getDashboard();
    const buffer = await this.exportService.exportDashboardPdf(stats);
    res.send(buffer);
  }
}
