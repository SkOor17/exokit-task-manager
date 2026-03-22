import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { TaskType, StatutTask } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  titre!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskType)
  @IsNotEmpty()
  type!: TaskType;

  @IsInt()
  @Min(0)
  @IsOptional()
  priorite?: number;

  @IsEnum(StatutTask)
  @IsOptional()
  statut?: StatutTask;

  @IsDateString()
  @IsOptional()
  dateEcheance?: string;

  @IsNumber()
  @IsOptional()
  tempsEstimeHumain?: number;

  @IsNumber()
  @IsOptional()
  tempsEstimeMachine?: number;

  @IsNumber()
  @IsOptional()
  tempsEstimeHuilage?: number;

  @IsString()
  @IsOptional()
  descriptionKit?: string;

  @IsString()
  @IsNotEmpty()
  dossierId!: string;

  @IsString()
  @IsOptional()
  operateurId?: string;
}
