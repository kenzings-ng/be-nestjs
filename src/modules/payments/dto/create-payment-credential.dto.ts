import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  CardBrand,
  GatewayPaymentMethod,
  PaymentEnvironment,
} from '../payment.types';
import type { PaymentCredentialKeys } from '../payment.types';

export class CreatePaymentCredentialDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 64)
  @Matches(/^[a-z0-9_-]+$/i, {
    message: 'provider chỉ gồm chữ, số, "_" hoặc "-"',
  })
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  provider!: string;

  @IsOptional()
  @IsEnum(PaymentEnvironment)
  environment?: PaymentEnvironment;

  /** JSON secret map. Values are never included in any response. */
  @IsObject()
  keys!: PaymentCredentialKeys;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(GatewayPaymentMethod, { each: true })
  paymentMethods!: GatewayPaymentMethod[];

  @IsOptional()
  @IsArray()
  @IsEnum(CardBrand, { each: true })
  cardBrands?: CardBrand[];

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z]{3}$/, {
    message: 'currency phải là mã ISO 4217 gồm 3 chữ cái',
  })
  @Transform(({ value }: { value: string }) => value?.toUpperCase())
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
