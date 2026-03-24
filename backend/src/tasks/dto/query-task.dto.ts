import { IsOptional, IsEnum, IsString } from 'class-validator';
import { TaskType, TaskStatus } from '@prisma/client';

export class QueryTaskDto {
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsString()
  @IsOptional()
  workOrderId?: string;

  @IsString()
  @IsOptional()
  search?: string;
}
