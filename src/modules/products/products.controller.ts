import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('products')
@ApiBearerAuth('access-token')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Admin only: create products
  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  // Public: anyone can browse products
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // Public: browse products by category slug. Khai báo trước ':slug' là cố ý.
  @Get('category/:categorySlug')
  findByCategory(@Param('categorySlug') categorySlug: string) {
    return this.productsService.findByCategory(categorySlug);
  }

  // Public: view a single product by slug
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.productsService.findOne(slug);
  }

  // Admin only: update products (slug trên URL là slug HIỆN TẠI của sản phẩm)
  @Put(':slug')
  @UseGuards(AdminGuard)
  update(
    @Param('slug') slug: string,
    @Body() updateProductDto: Partial<UpdateProductDto>,
  ) {
    return this.productsService.update(slug, updateProductDto);
  }

  // Admin only: delete products
  @Delete(':slug')
  @UseGuards(AdminGuard)
  delete(@Param('slug') slug: string) {
    return this.productsService.delete(slug);
  }
}
