import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('settings')
@ApiBearerAuth('access-token')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}
  @Get()
  @UseGuards(AdminGuard)
  getAll() {
    return this.settingsService.getAll();
  }
  @Get(':key')
  @UseGuards(AdminGuard)
  get(@Param('key') key: string) {
    return this.settingsService.get(key);
  }
  @Put(':key')
  @UseGuards(AdminGuard)
  set(@Param('key') key: string, @Body() body: { value: any }) {
    return this.settingsService.set(key, body.value);
  }
}
