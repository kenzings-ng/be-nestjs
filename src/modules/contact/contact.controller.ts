import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactReadDto } from './dto/update-contact-read.dto';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // Public: gửi tin nhắn từ trang Contact tới hộp mail của shop.
  @Post()
  send(@Body() dto: CreateContactDto) {
    return this.contactService.send(dto);
  }

  // Admin: xem toàn bộ tin nhắn liên hệ, mới nhất trước.
  @Get()
  @UseGuards(AdminGuard)
  @ApiBearerAuth('access-token')
  findAll() {
    return this.contactService.findAll();
  }

  // Admin: đánh dấu đã đọc / chưa đọc.
  @Patch(':id/read')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('access-token')
  markRead(@Param('id') id: string, @Body() dto: UpdateContactReadDto) {
    return this.contactService.markRead(id, dto.read);
  }
}
