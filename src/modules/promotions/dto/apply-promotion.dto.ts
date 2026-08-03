import { IsNotEmpty, IsString } from 'class-validator';
import { NormalizeCode } from '../../../common/normalize-code.transform';

/**
 * Xem trước hiệu lực của một mã trên giỏ hàng hiện tại. Không tiêu tốn lượt
 * dùng — lượt chỉ bị trừ khi checkout thành công.
 */
export class ApplyPromotionDto {
  @IsString()
  @IsNotEmpty()
  @NormalizeCode()
  code!: string;
}
