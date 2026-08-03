import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  /** Định danh trên URL, vd `apple`. Phải là duy nhất. */
  @IsString()
  @IsNotEmpty()
  slug!: string;
}
