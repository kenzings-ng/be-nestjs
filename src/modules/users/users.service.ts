import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from './schema/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';

// User data safe to return to clients (no password / tokens).
export interface PublicUser {
  id: unknown;
  email: string;
  name: string;
  role: UserRole;
  isVerified: boolean;
  isLocked?: boolean;
  profile: User['profile'];
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  findByVerificationTokenHash(hash: string): Promise<User | null> {
    return this.userModel.findOne({ verificationTokenHash: hash }).exec();
  }

  findByResetTokenHash(hash: string): Promise<User | null> {
    return this.userModel.findOne({ resetTokenHash: hash }).exec();
  }

  create(data: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    isVerified?: boolean;
  }): Promise<User> {
    const user = new this.userModel(data);
    return user.save();
  }

  // ---- Profiles ----

  /** The current user's public profile. */
  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return this.toPublicUser(user);
  }

  /** Update the current user's display name and/or profile fields. */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<PublicUser> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (dto.name !== undefined) {
      user.name = dto.name;
    }

    // Merge only the provided profile fields (partial update).
    const profile = user.profile ?? {};
    if (dto.phone !== undefined) profile.phone = dto.phone;
    if (dto.avatarUrl !== undefined) profile.avatarUrl = dto.avatarUrl;
    if (dto.bio !== undefined) profile.bio = dto.bio;
    if (dto.gender !== undefined) profile.gender = dto.gender;
    if (dto.dateOfBirth !== undefined) {
      profile.dateOfBirth = new Date(dto.dateOfBirth);
    }
    if (dto.address !== undefined) {
      profile.address = { ...profile.address, ...dto.address };
    }
    user.profile = profile;

    await user.save();
    return this.toPublicUser(user);
  }

  /** Admin: every user (sanitized). */
  async findAllPublic(): Promise<PublicUser[]> {
    const users = await this.userModel.find().exec();
    return users.map((u) => this.toPublicUser(u));
  }

  /** Admin: one user by id (sanitized). */
  async findPublicById(id: string): Promise<PublicUser> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return this.toPublicUser(user);
  }

  async adminUpdate(id: string, dto: AdminUpdateUserDto): Promise<PublicUser> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.isLocked !== undefined) user.isLocked = dto.isLocked;
    await user.save();
    return this.toPublicUser(user);
  }
  private toPublicUser(user: User): PublicUser {
    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
      isLocked: user.isLocked,
      profile: user.profile ?? {},
      createdAt: (user as unknown as { createdAt?: Date }).createdAt,
      updatedAt: (user as unknown as { updatedAt?: Date }).updatedAt,
    };
  }
}
