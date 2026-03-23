import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsBoolean()
  @IsOptional()
  actif?: boolean;
}
