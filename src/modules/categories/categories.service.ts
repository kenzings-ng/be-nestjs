import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './schema/category.schema';

/** Danh mục được định danh qua `slug` ở mọi route (xem thêm ProductsService). */
@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    await this.assertSlugFree(createCategoryDto.slug);
    return this.categoryModel.create(createCategoryDto);
  }

  findAll() {
    return this.categoryModel.find().exec();
  }

  async findOne(slug: string) {
    const category = await this.categoryModel.findOne({ slug }).exec();
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    return category;
  }

  async update(slug: string, updateCategoryDto: Partial<UpdateCategoryDto>) {
    // Slug nằm trên URL, nên khi đổi slug bản ghi vẫn được tìm bằng slug CŨ.
    if (updateCategoryDto.slug && updateCategoryDto.slug !== slug) {
      await this.assertSlugFree(updateCategoryDto.slug);
    }
    const category = await this.categoryModel
      .findOneAndUpdate({ slug }, updateCategoryDto, { new: true })
      .exec();
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    return category;
  }

  async delete(slug: string) {
    const category = await this.categoryModel.findOneAndDelete({ slug }).exec();
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    return category;
  }

  private async assertSlugFree(slug: string) {
    const existing = await this.categoryModel.findOne({ slug }).exec();
    if (existing) {
      throw new ConflictException(`Slug "${slug}" đã được dùng`);
    }
  }
}
