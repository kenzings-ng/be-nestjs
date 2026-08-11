import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MailService } from '../mail/mail.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { ContactMessage } from './schema/contact-message.schema';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly mailService: MailService,
    @InjectModel(ContactMessage.name)
    private readonly contactModel: Model<ContactMessage>,
  ) {}

  async send(dto: CreateContactDto) {
    // The saved record is the source of truth for the admin inbox — a mail
    // hiccup should never lose the message, so save first and email best-effort.
    await this.contactModel.create(dto);

    const to = this.config.get<string>('mail.contactTo') ?? 'admin@shop.com';
    try {
      await this.mailService.sendContactMessage(to, dto);
    } catch (err) {
      this.logger.warn(`Failed to send contact notification to ${to}: ${err}`);
    }

    return { message: 'Your message has been sent.' };
  }

  findAll() {
    return this.contactModel.find().sort({ createdAt: -1 }).exec();
  }

  async markRead(id: string, read: boolean) {
    const updated = await this.contactModel
      .findByIdAndUpdate(id, { read }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Contact message not found');
    }
    return updated;
  }
}
