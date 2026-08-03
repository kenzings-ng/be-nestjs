import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { DiscountType } from '../schema/promotion.schema';
import { NormalizeCode } from '../../../common/normalize-code.transform';

export class CreatePromotionDto {
  /** Mã người dùng nhập ở checkout. Chỉ chữ/số/`-`/`_`, tự động viết hoa. */
  @IsString()
  @IsNotEmpty()
  @NormalizeCode()
  @Matches(/^[A-Z0-9_-]{3,32}$/, {
    message:
      'Mã giảm giá chỉ gồm chữ, số, "-" hoặc "_" và dài từ 3 đến 32 ký tự',
  })
  code!: string;

  /** Mô tả hiển thị cho người dùng, vd "Giảm 10% cho đơn từ 500k". */
  @IsOptional()
  @IsString()
  description?: string;

  /** `percentage` = giảm theo %, `fixed` = giảm số tiền cố định. */
  @IsEnum(DiscountType)
  discountType!: DiscountType;

  /** Phần trăm (1..100) nếu là `percentage`, số tiền giảm nếu là `fixed`. */
  @IsNumber()
  @Min(0)
  discountValue!: number;

  /** Trần số tiền được giảm (chỉ dùng với `percentage`). */
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  /** Giá trị đơn hàng tối thiểu để dùng được mã. Mặc định 0. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  /** Thời điểm bắt đầu hiệu lực (ISO 8601). */
  @IsDateString()
  startDate!: string;

  /** Thời điểm hết hiệu lực (ISO 8601), phải sau `startDate`. */
  @IsDateString()
  endDate!: string;

  /** Tổng số lượt dùng tối đa. Bỏ trống = không giới hạn. */
  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  /** Số lượt tối đa mỗi user. Bỏ trống = không giới hạn. */
  @IsOptional()
  @IsInt()
  @Min(1)
  perUserLimit?: number;

  /** Mặc định `true`. Đặt `false` để tạo sẵn nhưng chưa cho dùng. */
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
