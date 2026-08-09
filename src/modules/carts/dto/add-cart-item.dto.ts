import { IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class AddCartItemDto {
  @IsMongoId()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  size?: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}
