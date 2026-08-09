import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../categories/schema/category.schema';
import { Product } from './schema/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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

  findAll(): Promise<Product[]> {
    return this.productModel
      .find()
      .populate('categoryId', 'title slug')
      .exec();
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
