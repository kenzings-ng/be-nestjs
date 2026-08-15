import { PartialType } from '@nestjs/swagger';
import { CreatePaymentCredentialDto } from './create-payment-credential.dto';

/** Omitted `keys` are preserved; supplying `keys` replaces the complete map. */
export class UpdatePaymentCredentialDto extends PartialType(
  CreatePaymentCredentialDto,
) {}
