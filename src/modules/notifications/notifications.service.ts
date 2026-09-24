import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './schema/notification.schema';
@Injectable()
export class NotificationsService {
  constructor(@InjectModel(Notification.name) private notificationModel: Model<Notification>) {}
  async create(params: { userId: string; title: string; message: string; type?: string; link?: string }) {
    const notif = new this.notificationModel(params);
    return notif.save();
  }
  async findByUser(userId: string, query?: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const filter: any = { userId };
    if (query?.unreadOnly) {
      filter.read = false;
    }
    
    const page = query?.page ? Number(query.page) : 1;
    const limit = query?.limit ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.notificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.notificationModel.countDocuments(filter).exec()
    ]);
    return { items, total, page, limit };
  }
  async markRead(id: string, userId: string) {
    return this.notificationModel.findOneAndUpdate({ _id: id, userId }, { read: true }, { new: true }).exec();
  }
  async markAllRead(userId: string) {
    return this.notificationModel.updateMany({ userId, read: false }, { read: true }).exec();
  }
  async countUnread(userId: string) {
    return this.notificationModel.countDocuments({ userId, read: false }).exec();
  }
}
