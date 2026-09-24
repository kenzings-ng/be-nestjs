import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  @Patch(':id')
  @UseGuards(AdminGuard)
  adminUpdate(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.usersService.adminUpdate(id, dto);
  }
  constructor(private readonly usersService: UsersService) {}

  // The current user's own profile.
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@CurrentUser('userId') userId: string) {
    return this.usersService.getProfile(userId);
  }

  // Update the current user's profile.
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMyProfile(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  // Admin: list all users.
  @Get()
  @UseGuards(AdminGuard)
  findAll() {
    return this.usersService.findAllPublic();
  }

  // Admin: a single user by id.
  @Get(':id')
  @UseGuards(AdminGuard)
  findOne(@Param('id') id: string) {
    return this.usersService.findPublicById(id);
  }
}
