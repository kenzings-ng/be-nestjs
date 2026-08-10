import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CreateProductDto, ProductColorDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsOptional()
  slug?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsOptional()
  name?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsOptional()
  description?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsNumber()
  @IsOptional()
  price?: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsNumber()
  @IsOptional()
  compareAtPrice?: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  @IsOptional()
  newArrival?: boolean;

  @ValidateIf((_, value) => value !== undefined)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ValidateIf((_, value) => value !== undefined)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  details?: string[];

  @ValidateIf((_, value) => value !== undefined)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductColorDto)
  @IsOptional()
  colors?: ProductColorDto[];

  @ValidateIf((_, value) => value !== undefined)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sizes?: string[];

  @ValidateIf((_, value) => value !== undefined)
  @IsNumber()
  @IsOptional()
  stock?: number;
}
