import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { CaseStatus } from '@prisma/client';

export class CreateCaseDto {
  @IsString()
  @IsNotEmpty()
  orderNumber!: string;

  @IsString()
  @IsNotEmpty()
  customer!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CaseStatus)
  @IsOptional()
  status?: CaseStatus;
}
