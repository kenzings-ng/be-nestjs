import { PartialType } from '@nestjs/swagger';
import { CreateBrandDto } from './create-brand.dto';

/** Mọi field đều tùy chọn; chỉ field được gửi lên mới bị thay đổi. */
export class UpdateBrandDto extends PartialType(CreateBrandDto) {}
