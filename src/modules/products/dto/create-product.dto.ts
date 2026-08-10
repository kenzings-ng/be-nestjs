import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ProductColorDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  hex!: string;
}

export class CreateProductDto {
  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @IsNumber()
  @IsOptional()
  compareAtPrice?: number;

  @IsBoolean()
  @IsOptional()
  newArrival?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  details?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductColorDto)
  @IsOptional()
  colors?: ProductColorDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sizes?: string[];

  @IsNumber()
  @IsNotEmpty()
  stock!: number;
}
