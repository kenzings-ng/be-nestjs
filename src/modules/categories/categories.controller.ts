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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('categories')
@ApiBearerAuth('access-token')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.categoriesService.findOne(slug);
  }

  // Slug trên URL là slug HIỆN TẠI của danh mục (body có thể đổi sang slug mới).
  @Patch(':slug')
  @UseGuards(AdminGuard)
  update(
    @Param('slug') slug: string,
    @Body() updateCategoryDto: Partial<UpdateCategoryDto>,
  ) {
    return this.categoriesService.update(slug, updateCategoryDto);
  }

  @Delete(':slug')
  @UseGuards(AdminGuard)
  delete(@Param('slug') slug: string) {
    return this.categoriesService.delete(slug);
  }
}
