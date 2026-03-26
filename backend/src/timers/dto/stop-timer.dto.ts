import { IsString, IsOptional } from 'class-validator';

export class StopTimerDto {
  @IsString()
  @IsOptional()
  notes?: string;
}
