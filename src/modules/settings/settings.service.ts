import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting } from './schema/settings.schema';
@Injectable()
export class SettingsService {
  constructor(@InjectModel(Setting.name) private settingModel: Model<Setting>) {}
  async get(key: string): Promise<any> {
    const setting = await this.settingModel.findOne({ key }).exec();
    return setting ? setting.value : null;
  }
  async set(key: string, value: any): Promise<Setting> {
    return this.settingModel.findOneAndUpdate(
      { key },
      { value },
      { new: true, upsert: true }
    ).exec();
  }
  async getAll(): Promise<Setting[]> {
    return this.settingModel.find().exec();
  }
}
