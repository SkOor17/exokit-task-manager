import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  Min,
} from 'class-validator';
import { TaskType, StatutTask } from '@prisma/client';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  titre?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

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

  @IsString()
  @IsOptional()
  descriptionKit?: string;

  @IsString()
  @IsOptional()
  noteCompletion?: string;

  @IsString()
  @IsOptional()
  operateurId?: string;
}
