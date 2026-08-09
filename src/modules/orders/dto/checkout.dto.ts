import { IsEnum, IsOptional, IsString } from 'class-validator';
import { NormalizeCode } from '../../../common/normalize-code.transform';
import { PaymentMethod } from '../../transactions/schema/transaction.schema';

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

  /** Mock — không có cổng thanh toán thật, chỉ để gắn nhãn transaction. */
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}
