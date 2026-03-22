import { IsOptional, IsEnum, IsString } from 'class-validator';
import { TaskType, StatutTask } from '@prisma/client';

export class QueryTaskDto {
  @IsEnum(StatutTask)
  @IsOptional()
  statut?: StatutTask;

  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @IsString()
  @IsOptional()
  operateurId?: string;

  @IsString()
  @IsOptional()
  dossierId?: string;

  @IsString()
  @IsOptional()
  search?: string;
}
