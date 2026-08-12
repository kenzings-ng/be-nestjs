import { IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

/** Admin may omit amount to request a full refund of the remaining amount. */
export class RefundOrderDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  @Length(1, 250)
  reason?: string;
}
