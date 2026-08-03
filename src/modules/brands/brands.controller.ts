import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('brands')
@ApiBearerAuth('access-token')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  // Admin: tạo thương hiệu.
  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandsService.create(createBrandDto);
  }

  // Public: danh sách thương hiệu.
  @Get()
  findAll() {
    return this.brandsService.findAll();
  }

  // Public: một thương hiệu theo slug.
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.brandsService.findOne(slug);
  }

  // Admin: cập nhật (slug trên URL là slug HIỆN TẠI của thương hiệu).
  @Patch(':slug')
  @UseGuards(AdminGuard)
  update(
    @Param('slug') slug: string,
    @Body() updateBrandDto: Partial<UpdateBrandDto>,
  ) {
    return this.brandsService.update(slug, updateBrandDto);
  }

  // Admin: xóa.
  @Delete(':slug')
  @UseGuards(AdminGuard)
  remove(@Param('slug') slug: string) {
    return this.brandsService.remove(slug);
  }
}
