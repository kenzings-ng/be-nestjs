import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ArticlesService } from './articles.service';

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  findAll(@Query('limit') limit?: string) {
    const lim = limit ? parseInt(limit, 10) : 20;
    return this.articlesService.findAll(lim);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.articlesService.findBySlug(slug);
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth('access-token')
  create(@Body() body: any) {
    return this.articlesService.create(body);
  }

  @Patch(':slug')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('access-token')
  update(@Param('slug') slug: string, @Body() body: any) {
    return this.articlesService.update(slug, body);
  }

  @Delete(':slug')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('access-token')
  delete(@Param('slug') slug: string) {
    return this.articlesService.delete(slug);
  }
}
