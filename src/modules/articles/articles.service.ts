import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Article } from './schema/article.schema';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectModel(Article.name) private readonly articleModel: Model<Article>,
  ) {}

  findAll(limit = 20): Promise<Article[]> {
    return this.articleModel
      .find()
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async findBySlug(slug: string): Promise<Article> {
    const article = await this.articleModel.findOne({ slug }).exec();
    if (!article) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }
    return article;
  }

  create(data: Partial<Article>): Promise<Article> {
    const article = new this.articleModel(data);
    return article.save();
  }

  async update(slug: string, data: Partial<Article>): Promise<Article> {
    const article = await this.articleModel
      .findOneAndUpdate({ slug }, data, { new: true })
      .exec();
    if (!article) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }
    return article;
  }

  async delete(slug: string): Promise<{ deleted: true; slug: string }> {
    const res = await this.articleModel.deleteOne({ slug }).exec();
    if (res.deletedCount === 0) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }
    return { deleted: true, slug };
  }
}
