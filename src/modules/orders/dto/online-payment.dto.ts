import { Type } from 'class-transformer';
import {
  IsEnum,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  CardBrand,
  GatewayPaymentMethod,
  PaymentEnvironment,
} from '../../payments/payment.types';

export enum ComeshPaymentSourceType {
  CHECKOUT = 'checkout',
  CARD = 'card',
  TOKEN = 'token',
}

export class CardSourceDto {
  @IsString()
  @Matches(/^\d{12,19}$/, { message: 'Số thẻ không hợp lệ' })
  number!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 128)
  holderName!: string;

  @IsString()
  @Matches(/^(0[1-9]|1[0-2])$/, { message: 'expiryMonth phải từ 01 đến 12' })
  expiryMonth!: string;

  @IsString()
  @Matches(/^\d{4}$/, { message: 'expiryYear phải gồm 4 chữ số' })
  expiryYear!: string;

  @IsString()
  @Matches(/^\d{3,4}$/, { message: 'CVV phải gồm 3 hoặc 4 chữ số' })
  cvv!: string;
}

export class TokenSourceDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  id!: string;
}

/** ComesH v3 source. Card data is transient: it is forwarded and never persisted. */
export class ComeshPaymentSourceDto {
  @IsEnum(ComeshPaymentSourceType)
  type!: ComeshPaymentSourceType;

  @ValidateIf(
    (source: ComeshPaymentSourceDto) =>
      source.type === ComeshPaymentSourceType.CARD,
  )
  @IsDefined({ message: 'Thiếu thông tin thẻ' })
  @ValidateNested()
  @Type(() => CardSourceDto)
  card?: CardSourceDto;

  @ValidateIf(
    (source: ComeshPaymentSourceDto) =>
      source.type === ComeshPaymentSourceType.TOKEN,
  )
  @IsDefined({ message: 'Thiếu payment token' })
  @ValidateNested()
  @Type(() => TokenSourceDto)
  token?: TokenSourceDto;
}

export class BrowserDto {
  /** If omitted, the backend uses the User-Agent header from this request. */
  @IsOptional()
  @IsString()
  @Length(1, 512)
  userAgent?: string;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  acceptLanguage?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  screenWidth?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  screenHeight?: number;

  @IsOptional()
  @IsInt()
  @Min(-840)
  @Max(840)
  timeZoneOffset?: number;
}

export class PaymentAddressDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(1, 256)
  email?: string;

  @IsOptional()
  @IsString()
  @Length(1, 48)
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  line1!: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  line2?: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  city!: string;

  @IsOptional()
  @IsString()
  @Length(1, 128)
  state?: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  postalCode?: string;

  @IsString()
  @Matches(/^[A-Za-z]{2}$/, {
    message: 'country phải là mã ISO 3166-1 alpha-2',
  })
  country!: string;
}

/** Payload required to initiate an online payment after an order is created. */
export class OnlinePaymentDto {
  /** Unique token for this payment attempt; reused as the idempotency key. */
  @IsOptional()
  @IsString()
  @Length(8, 128)
  token?: string;
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_-]+$/i, {
    message: 'provider chỉ gồm chữ, số, "_" hoặc "-"',
  })
  provider!: string;

  /** Required only when the same provider has multiple active environments. */
  @IsOptional()
  @IsEnum(PaymentEnvironment)
  environment?: PaymentEnvironment;

  /** The method chosen by the buyer; it must be enabled in paymentCredentials. */
  @IsEnum(GatewayPaymentMethod)
  paymentMethod!: GatewayPaymentMethod;

  /** Optional filter against the configured cardBrands list. */
  @IsOptional()
  @IsEnum(CardBrand)
  cardBrand?: CardBrand;

  @IsDefined({ message: 'Thiếu payment source' })
  @ValidateNested()
  @Type(() => ComeshPaymentSourceDto)
  source!: ComeshPaymentSourceDto;

  @IsDefined({ message: 'Thiếu thông tin trình duyệt' })
  @ValidateNested()
  @Type(() => BrowserDto)
  browser!: BrowserDto;

  @IsDefined({ message: 'Thiếu địa chỉ thanh toán' })
  @ValidateNested()
  @Type(() => PaymentAddressDto)
  billingAddress!: PaymentAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentAddressDto)
  shippingAddress?: PaymentAddressDto;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @Length(1, 1024)
  returnUrl?: string;

  @IsOptional()
  @IsString()
  @Length(1, 16)
  locale?: string;

  /** ComesH metadata accepts string key-value pairs only. */
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}
