import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../schema/user.schema';
export class AdminUpdateUserDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;
}
