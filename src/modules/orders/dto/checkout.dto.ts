import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { NormalizeCode } from '../../../common/normalize-code.transform';
import { PaymentMethod } from '../../transactions/schema/transaction.schema';
import { OnlinePaymentDto } from './online-payment.dto';

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

  /** COD/manual legacy payment. For an online gateway, use `payment` below. */
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  /** Online payment request. Card values, when supplied, are never stored. */
  @IsOptional()
  @ValidateNested()
  @Type(() => OnlinePaymentDto)
  payment?: OnlinePaymentDto;
}
