import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@/common/constants';

const ASSIGNABLE_STAFF_ROLES = [
  UserRole.ADMIN,
  UserRole.SELLER,
  UserRole.DELIVERY,
] as const;

export class CreateTeamUserDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsIn(ASSIGNABLE_STAFF_ROLES)
  role!: (typeof ASSIGNABLE_STAFF_ROLES)[number];

  @IsOptional()
  @IsString()
  phone?: string;
}

export class UpdateTeamUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(ASSIGNABLE_STAFF_ROLES)
  role?: (typeof ASSIGNABLE_STAFF_ROLES)[number];

  @IsOptional()
  enabled?: boolean;
}
