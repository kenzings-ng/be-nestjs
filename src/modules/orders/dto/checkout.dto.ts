import { IsOptional, IsString } from 'class-validator';
import { NormalizeCode } from '../../../common/normalize-code.transform';

/**
 * Checkout turns the current user's cart into an order. No item data is sent —
 * the server reads the cart, snapshots prices, and validates stock server-side.
 */
export class CheckoutDto {
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  /** Mã giảm giá (tùy chọn). Server tự kiểm tra hiệu lực và tính lại số tiền giảm. */
  @IsOptional()
  @IsString()
  @NormalizeCode()
  promotionCode?: string;
}
