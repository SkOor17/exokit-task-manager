import { IsString, IsOptional, IsEnum } from 'class-validator';
import { CaseStatus } from '@prisma/client';

export class UpdateCaseDto {
  @IsString()
  @IsOptional()
  orderNumber?: string;

  @IsString()
  @IsOptional()
  customer?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CaseStatus)
  @IsOptional()
  status?: CaseStatus;
}
