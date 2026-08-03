import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { Brand } from './schema/brand.schema';

/** Thương hiệu được định danh qua `slug` ở mọi route (xem ProductsService). */
@Injectable()
export class BrandsService {
  constructor(
    @InjectModel(Brand.name) private readonly brandModel: Model<Brand>,
  ) {}

  async create(createBrandDto: CreateBrandDto) {
    await this.assertSlugFree(createBrandDto.slug);
    return this.brandModel.create(createBrandDto);
  }

  findAll() {
    return this.brandModel.find().sort({ name: 1 }).exec();
  }

  async findOne(slug: string) {
    const brand = await this.brandModel.findOne({ slug }).exec();
    if (!brand) {
      throw new NotFoundException('Không tìm thấy thương hiệu');
    }
    return brand;
  }

  async update(slug: string, updateBrandDto: Partial<UpdateBrandDto>) {
    // Slug nằm trên URL, nên khi đổi slug bản ghi vẫn được tìm bằng slug CŨ.
    if (updateBrandDto.slug && updateBrandDto.slug !== slug) {
      await this.assertSlugFree(updateBrandDto.slug);
    }
    const brand = await this.brandModel
      .findOneAndUpdate({ slug }, updateBrandDto, { new: true })
      .exec();
    if (!brand) {
      throw new NotFoundException('Không tìm thấy thương hiệu');
    }
    return brand;
  }

  async remove(slug: string) {
    const brand = await this.brandModel.findOneAndDelete({ slug }).exec();
    if (!brand) {
      throw new NotFoundException('Không tìm thấy thương hiệu');
    }
    return brand;
  }

  private async assertSlugFree(slug: string) {
    const existing = await this.brandModel.findOne({ slug }).exec();
    if (existing) {
      throw new ConflictException(`Slug "${slug}" đã được dùng`);
    }
  }
}
