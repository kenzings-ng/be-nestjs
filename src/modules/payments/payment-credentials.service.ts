import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction } from '../transactions/schema/transaction.schema';
import { CreatePaymentCredentialDto } from './dto/create-payment-credential.dto';
import { UpdatePaymentCredentialDto } from './dto/update-payment-credential.dto';
import { PaymentEnvironment } from './payment.types';
import { PaymentCredential } from './schema/payment-credential.schema';

export type SafePaymentCredential = Omit<Record<string, unknown>, 'keys'> & {
  id: string;
  provider: string;
  environment: string;
  paymentMethods: string[];
  cardBrands: string[];
  currency: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type AdminPaymentCredential = SafePaymentCredential & {
  keys: Record<string, string>;
};

@Injectable()
export class PaymentCredentialsService {
  constructor(
    @InjectModel(PaymentCredential.name)
    private readonly paymentCredentialModel: Model<PaymentCredential>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
    private readonly config: ConfigService,
  ) {}

  async create(
    dto: CreatePaymentCredentialDto,
  ): Promise<SafePaymentCredential> {
    try {
      const credential = await this.paymentCredentialModel.create(dto);
      return this.toSafe(credential);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException(
          'Provider đã có cấu hình cho environment này',
        );
      }
      throw error;
    }
  }

  async findAll(): Promise<SafePaymentCredential[]> {
    const credentials = await this.paymentCredentialModel
      .find()
      .sort({ provider: 1, environment: 1 })
      .exec();
    return credentials.map((credential) => this.toSafe(credential));
  }

  async findAllForAdmin(): Promise<AdminPaymentCredential[]> {
    const credentials = await this.paymentCredentialModel
      .find()
      .select('+keys')
      .sort({ provider: 1, environment: 1 })
      .exec();
    return credentials.map((credential) => this.toAdmin(credential));
  }

  async findOne(id: string): Promise<SafePaymentCredential> {
    const credential = await this.findByIdOrThrow(id);
    return this.toSafe(credential);
  }

  async findOneForAdmin(id: string): Promise<AdminPaymentCredential> {
    const credential = await this.findByIdOrThrow(id, true);
    return this.toAdmin(credential);
  }

  /** Active configurations which are safe for a checkout UI to display. */
  async findAvailable(): Promise<SafePaymentCredential[]> {
    const environment =
      this.config.get<PaymentEnvironment>('payment.environment') ??
      PaymentEnvironment.SANDBOX;
    const credentials = await this.paymentCredentialModel
      .find({ isActive: true, environment })
      .sort({ provider: 1, environment: 1 })
      .exec();
    return credentials.map((credential) => this.toSafe(credential));
  }

  async update(
    id: string,
    dto: UpdatePaymentCredentialDto,
  ): Promise<SafePaymentCredential> {
    const credential = await this.findByIdOrThrow(id, true);
    const { keys, ...values } = dto;
    Object.assign(credential, values);
    if (keys !== undefined) credential.keys = keys;

    try {
      await credential.save();
      return this.toSafe(credential);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException(
          'Provider đã có cấu hình cho environment này',
        );
      }
      throw error;
    }
  }

  async remove(id: string): Promise<{ deleted: true; id: string }> {
    const credential = await this.findByIdOrThrow(id);
    const isUsed = await this.transactionModel
      .exists({ paymentCredentialId: credential._id })
      .exec();
    if (isUsed) {
      throw new ConflictException(
        'Cấu hình này đã có giao dịch. Hãy đặt isActive=false thay vì xóa để còn đối soát webhook/refund.',
      );
    }
    await credential.deleteOne();
    return { deleted: true, id };
  }

  /** Used only by payment adapters. The `keys` field stays select:false elsewhere. */
  async findActiveForProvider(
    provider: string,
    environment?: PaymentEnvironment,
  ): Promise<PaymentCredential> {
    const credentials = await this.paymentCredentialModel
      .find({
        provider: provider.toLowerCase(),
        isActive: true,
        ...(environment ? { environment } : {}),
      })
      .select('+keys')
      .exec();
    if (credentials.length === 0) {
      throw new NotFoundException(
        `Không có cổng thanh toán đang bật: ${provider}`,
      );
    }
    if (credentials.length > 1) {
      throw new ConflictException(
        `Có nhiều environment đang bật cho ${provider}; checkout phải gửi payment.environment`,
      );
    }
    return credentials[0];
  }

  async findInternalById(id: string): Promise<PaymentCredential> {
    return this.findByIdOrThrow(id, true);
  }

  /**
   * Disabled credentials remain eligible for webhooks so that payments created
   * before deactivation can still be settled or refunded safely.
   */
  findForWebhook(provider: string): Promise<PaymentCredential[]> {
    return this.paymentCredentialModel
      .find({ provider: provider.toLowerCase() })
      .select('+keys')
      .exec();
  }

  private async findByIdOrThrow(
    id: string,
    includeKeys = false,
  ): Promise<PaymentCredential> {
    const query = this.paymentCredentialModel.findById(id);
    if (includeKeys) query.select('+keys');
    const credential = await query.exec();
    if (!credential) {
      throw new NotFoundException('Không tìm thấy cấu hình cổng thanh toán');
    }
    return credential;
  }

  private toSafe(credential: PaymentCredential): SafePaymentCredential {
    return {
      id: credential._id.toString(),
      provider: credential.provider,
      environment: credential.environment,
      paymentMethods: credential.paymentMethods,
      cardBrands: credential.cardBrands,
      currency: credential.currency,
      isActive: credential.isActive,
      createdAt: (credential as unknown as { createdAt?: Date }).createdAt,
      updatedAt: (credential as unknown as { updatedAt?: Date }).updatedAt,
    };
  }

  private toAdmin(credential: PaymentCredential): AdminPaymentCredential {
    return { ...this.toSafe(credential), keys: credential.keys };
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11000
  );
}
