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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { ApplyPromotionDto } from './dto/apply-promotion.dto';

@ApiTags('promotions')
@ApiBearerAuth('access-token')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  // Admin: tạo mã giảm giá.
  @Post()
  @UseGuards(AdminGuard)
  create(@Body() dto: CreatePromotionDto) {
    return this.promotionsService.create(dto);
  }

  // Admin: toàn bộ mã, kể cả mã đã tắt hoặc hết hạn.
  @Get()
  @UseGuards(AdminGuard)
  findAll() {
    return this.promotionsService.findAll();
  }

  // Public: các mã đang còn hiệu lực. Khai báo trước ':id' là cố ý.
  @Get('active')
  findActive() {
    return this.promotionsService.findActive();
  }

  // User: xem trước số tiền được giảm trên giỏ hàng hiện tại (chưa trừ lượt dùng).
  @Post('apply')
  @UseGuards(JwtAuthGuard)
  apply(@CurrentUser('userId') userId: string, @Body() dto: ApplyPromotionDto) {
    return this.promotionsService.previewForCart(userId, dto.code);
  }

  // Admin: chi tiết một mã.
  @Get(':id')
  @UseGuards(AdminGuard)
  findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  // Admin: cập nhật một mã.
  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.promotionsService.update(id, dto);
  }

  // Admin: xóa một mã.
  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }
}
