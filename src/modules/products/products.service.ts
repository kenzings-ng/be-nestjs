import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter } from 'mongoose';
import { PaginatedResult } from '../../common/pagination';
import { Category } from '../categories/schema/category.schema';
import { Product } from './schema/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto, ProductSort } from './dto/product-query.dto';

/**
 * Sản phẩm được định danh qua `slug` ở mọi route — slug thân thiện URL/SEO và
 * không lộ _id nội bộ. `_id` vẫn là khóa thật trong DB và là thứ các collection
 * khác (cart, order) tham chiếu tới.
 */
@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    await this.assertSlugFree(createProductDto.slug);
    return this.productModel.create(createProductDto);
  }

  async findAll(query: ProductQueryDto = new ProductQueryDto()): Promise<PaginatedResult<Product>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;

    const filter: QueryFilter<Product> = {};
    if (query.search) {
      filter.name = { $regex: escapeRegex(query.search), $options: 'i' };
    }
    if (query.categoryId) {
      filter.categoryId = query.categoryId;
    }
    if (query.minPrice != null || query.maxPrice != null) {
      filter.price = {};
      if (query.minPrice != null) filter.price.$gte = query.minPrice;
      if (query.maxPrice != null) filter.price.$lte = query.maxPrice;
    }

    const [items, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('categoryId', 'title slug')
        .sort(resolveSort(query.sort))
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findOne(slug: string): Promise<Product> {
    const product = await this.productModel
      .findOne({ slug })
      .populate('categoryId', 'title slug')
      .exec();
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    return product;
  }

  /** Sản phẩm trong một danh mục, danh mục cũng tra theo slug. */
  async findByCategory(categorySlug: string): Promise<Product[]> {
    const category = await this.categoryModel
      .findOne({ slug: categorySlug })
      .exec();
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    return this.productModel
      .find({ categoryId: category._id })
      .populate('categoryId', 'title slug')
      .exec();
  }

  async update(slug: string, updateProductDto: Partial<UpdateProductDto>) {
    // Slug nằm trên URL, nên khi đổi slug bản ghi vẫn được tìm bằng slug CŨ.
    if (updateProductDto.slug && updateProductDto.slug !== slug) {
      await this.assertSlugFree(updateProductDto.slug);
    }
    const product = await this.productModel
      .findOneAndUpdate({ slug }, updateProductDto, { new: true })
      .exec();
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    return product;
  }

  async delete(slug: string): Promise<Product> {
    const product = await this.productModel.findOneAndDelete({ slug }).exec();
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    return product;
  }

  private async assertSlugFree(slug: string) {
    const existing = await this.productModel.findOne({ slug }).exec();
    if (existing) {
      throw new ConflictException(`Slug "${slug}" đã được dùng`);
    }
  }
}

function resolveSort(sort?: ProductSort): Record<string, 1 | -1> {
  switch (sort) {
    case 'price-asc':
      return { price: 1 };
    case 'price-desc':
      return { price: -1 };
    case 'name-asc':
      return { name: 1 };
    case 'newest':
    default:
      return { createdAt: -1 };
  }
}

/** Escape regex metacharacters so `search` is treated as a literal substring. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
