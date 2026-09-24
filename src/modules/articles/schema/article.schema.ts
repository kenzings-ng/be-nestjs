import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Article extends Document {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true, unique: true })
  slug!: string;

  @Prop({ required: true })
  summary!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ required: true })
  coverImage!: string;

  @Prop({ default: 'Editorial' })
  category!: string;

  @Prop({ default: '4 min read' })
  readTime!: string;

  @Prop({ default: 'MAISON Editorial' })
  author!: string;

  @Prop({ default: () => new Date() })
  publishedAt!: Date;

  @Prop({ type: [String], default: [] })
  tags!: string[];
}

export const ArticleSchema = SchemaFactory.createForClass(Article);
