import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}
  @Get()
  @UseGuards(JwtAuthGuard)
  findByUser(@CurrentUser('userId') userId: string, @Query() query: any) {
    return this.notificationsService.findByUser(userId, query);
  }
  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  async countUnread(@CurrentUser('userId') userId: string) {
    const count = await this.notificationsService.countUnread(userId);
    return { count };
  }
  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  markAllRead(@CurrentUser('userId') userId: string) {
    return this.notificationsService.markAllRead(userId);
  }
  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  markRead(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.notificationsService.markRead(id, userId);
  }
  @Post()
  @UseGuards(AdminGuard)
  create(@Body() body: { userId: string; title: string; message: string; type?: string; link?: string }) {
    return this.notificationsService.create(body);
  }
}
