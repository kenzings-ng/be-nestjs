import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';
import {
  PaymentMethod,
  Transaction,
  TransactionStatus,
  TransactionType,
} from './schema/transaction.schema';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
  ) {}

  /** Records one payment/refund event. No real gateway — always "succeeds". */
  record(params: {
    orderId: Types.ObjectId;
    userId: Types.ObjectId;
    type: TransactionType;
    amount: number;
    method?: PaymentMethod;
    status?: TransactionStatus;
    note?: string;
  }): Promise<Transaction> {
    return this.transactionModel.create({
      orderId: params.orderId,
      userId: params.userId,
      type: params.type,
      amount: params.amount,
      method: params.method ?? PaymentMethod.COD,
      status: params.status ?? TransactionStatus.SUCCESS,
      note: params.note,
      reference: this.generateReference(params.type),
    });
  }

  /** All transactions for one order, oldest first (payment, then refund...). */
  findByOrder(orderId: Types.ObjectId): Promise<Transaction[]> {
    return this.transactionModel
      .find({ orderId })
      .sort({ createdAt: 1 })
      .exec();
  }

  private generateReference(type: TransactionType): string {
    const prefix = type === TransactionType.REFUND ? 'RFD' : 'TXN';
    return `${prefix}-${randomBytes(5).toString('hex').toUpperCase()}`;
  }
}
