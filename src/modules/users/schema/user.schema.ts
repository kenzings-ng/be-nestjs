import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

// Structured shipping/contact address kept on the profile.
@Schema({ _id: false })
export class Address {
  @Prop()
  line1?: string;

  @Prop()
  ward?: string;

  @Prop()
  district?: string;

  @Prop()
  city?: string;

  @Prop()
  country?: string;
}
export const AddressSchema = SchemaFactory.createForClass(Address);

// Per-user profile: personal details separate from auth/account fields.
@Schema({ _id: false })
export class Profile {
  @Prop()
  phone?: string;

  @Prop()
  avatarUrl?: string;

  @Prop()
  bio?: string;

  @Prop({ type: String, enum: Gender })
  gender?: Gender;

  @Prop()
  dateOfBirth?: Date;

  @Prop({ type: AddressSchema })
  address?: Address;
}
export const ProfileSchema = SchemaFactory.createForClass(Profile);

// A stored (hashed) refresh token = one active session/device.
@Schema({ _id: false })
export class RefreshTokenEntry {
  @Prop({ required: true })
  tokenHash!: string;

  @Prop({ required: true })
  expiresAt!: Date;
}
export const RefreshTokenEntrySchema =
  SchemaFactory.createForClass(RefreshTokenEntry);

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Prop({ default: false })
  isVerified!: boolean;
  @Prop({ default: false })
  isLocked!: boolean;

  // Personal profile details (optional, editable by the user).
  @Prop({ type: ProfileSchema, default: () => ({}) })
  profile!: Profile;

  // Active refresh tokens (hashed), one per logged-in device.
  @Prop({ type: [RefreshTokenEntrySchema], default: [] })
  refreshTokens!: RefreshTokenEntry[];

  // Email verification (SHA-256 hash of the emailed token).
  @Prop()
  verificationTokenHash?: string;

  @Prop()
  verificationTokenExpires?: Date;

  // Password reset (SHA-256 hash of the emailed token).
  @Prop()
  resetTokenHash?: string;

  @Prop()
  resetTokenExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
