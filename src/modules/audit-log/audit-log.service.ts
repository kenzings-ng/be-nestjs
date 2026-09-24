import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from './schema/audit-log.schema';
@Injectable()
export class AuditLogService {
  constructor(@InjectModel(AuditLog.name) private auditLogModel: Model<AuditLog>) {}
  async log(params: { action: string; performedBy: string; targetType?: string; targetId?: string; details?: any; ipAddress?: string }) {
    const logEntry = new this.auditLogModel(params);
    return logEntry.save();
  }
  async findAll(query?: { page?: number; limit?: number; action?: string; performedBy?: string; targetType?: string; from?: string; to?: string }) {
    const filter: any = {};
    if (query?.action) filter.action = query.action;
    if (query?.performedBy) filter.performedBy = query.performedBy;
    if (query?.targetType) filter.targetType = query.targetType;
    if (query?.from || query?.to) {
      filter.createdAt = {};
      if (query?.from) filter.createdAt.$gte = new Date(query.from);
      if (query?.to) filter.createdAt.$lte = new Date(query.to);
    }
    
    const page = query?.page ? Number(query.page) : 1;
    const limit = query?.limit ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.auditLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.auditLogModel.countDocuments(filter).exec()
    ]);
    return { items, total, page, limit };
  }
}
