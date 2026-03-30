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
import { TaskType, TaskStatus } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskType)
  @IsNotEmpty()
  type!: TaskType;

  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsDateString()
  @IsNotEmpty()
  dueDate!: string;

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
  @IsNotEmpty()
  workOrderId!: string;

  @IsString()
  @IsNotEmpty()
  assignedToId!: string;
}
