import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { TaskType, TaskStatus } from '@prisma/client';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsNumber()
  @IsOptional()
  estimatedHumanTime?: number;

  @IsNumber()
  @IsOptional()
  estimatedMachineTime?: number;

  @IsNumber()
  @IsOptional()
  estimatedOilingTime?: number;

  @IsString()
  @IsOptional()
  kitDescription?: string;

  @IsString()
  @IsOptional()
  completionNotes?: string;

  @IsString()
  @IsOptional()
  workOrderId?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsDateString()
  @IsOptional()
  completedAt?: string;
}
