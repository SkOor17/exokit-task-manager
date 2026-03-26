import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { WorkOrderStatus } from '@prisma/client';

export class UpdateWorkOrderDto {
  @IsString()
  @IsOptional()
  orderNumber?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  productType?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(WorkOrderStatus)
  @IsOptional()
  status?: WorkOrderStatus;

  @IsDateString()
  @IsOptional()
  expectedDelivery?: string;

  @IsDateString()
  @IsOptional()
  actualDelivery?: string;

  @IsOptional()
  billOfMaterials?: any;

  @IsOptional()
  specifications?: any;

  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @IsNumber()
  @IsOptional()
  actualCost?: number;

  @IsNumber()
  @IsOptional()
  sellingPrice?: number;
}
