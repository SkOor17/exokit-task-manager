import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { WorkOrderStatus } from '@prisma/client';

export class CreateWorkOrderDto {
  @IsString()
  @IsNotEmpty()
  orderNumber!: string;

  @IsString()
  @IsNotEmpty()
  customerName!: string;

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

  @IsOptional()
  billOfMaterials?: any;

  @IsOptional()
  specifications?: any;

  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @IsNumber()
  @IsOptional()
  sellingPrice?: number;
}
