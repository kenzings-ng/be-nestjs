import { PartialType } from '@nestjs/swagger';
import { CreatePromotionDto } from './create-promotion.dto';

/** Mọi field đều tùy chọn; chỉ những field được gửi lên mới bị thay đổi. */
export class UpdatePromotionDto extends PartialType(CreatePromotionDto) {}
