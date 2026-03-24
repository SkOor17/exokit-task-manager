import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { TimeType } from '@prisma/client';

export class StartTimerDto {
  @IsString()
  @IsNotEmpty()
  taskId!: string;

  @IsEnum(TimeType)
  @IsOptional()
  timeType?: TimeType;
}
