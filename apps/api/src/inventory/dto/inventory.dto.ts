import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { StockTransactionType } from '@prisma/client';

export enum StockStatus {
  AVAILABLE = 'AVAILABLE',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

export class StockIntakeDto {
  @ApiProperty({ description: 'CUID of the facility receiving the stock' })
  @IsString()
  @IsNotEmpty()
  facilityId: string;

  @ApiProperty({ description: 'CUID of the medicine being received' })
  @IsString()
  @IsNotEmpty()
  medicineId: string;

  @ApiProperty({ example: 100, description: 'Quantity received (must be positive)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'tablets', description: 'Unit of measurement' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ example: 'BATCH-2026-08' })
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional({ example: '2028-12-31T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ example: 'District Medical Depot' })
  @IsString()
  @IsOptional()
  supplier?: string;

  @ApiPropertyOptional({ example: 'INV-2026-8812' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({
    example: 'intake-batch-2026-09-08-uuid',
    description: 'Unique idempotency key to prevent duplicate receipts over flaky 2G connections',
  })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @ApiPropertyOptional({ example: 'Regular monthly consignment' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class StockAdjustmentDto {
  @ApiProperty({ description: 'CUID of the facility' })
  @IsString()
  @IsNotEmpty()
  facilityId: string;

  @ApiProperty({ description: 'CUID of the medicine' })
  @IsString()
  @IsNotEmpty()
  medicineId: string;

  @ApiProperty({
    enum: StockTransactionType,
    example: StockTransactionType.ISSUE,
    description:
      'Transaction type: RECEIPT (increment), ISSUE (decrement), ADJUSTMENT (count sync), CORRECTION',
  })
  @IsEnum(StockTransactionType)
  type: StockTransactionType;

  @ApiProperty({
    example: 10,
    description:
      'Quantity for the transaction. For ISSUE or RECEIPT, this is the delta (must be >= 1). For ADJUSTMENT, this is the verified new stock balance (must be >= 0).',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ example: 'BATCH-2026-08' })
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional({ example: 'RX-99412' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ example: 'Dispensed for OPD prescription' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class InventoryQueryDto {
  @ApiPropertyOptional({ description: 'Search term for medicine name or generic name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    enum: StockStatus,
    description: 'Filter by stock status: AVAILABLE, LOW_STOCK, OUT_OF_STOCK',
  })
  @IsEnum(StockStatus)
  @IsOptional()
  status?: StockStatus;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}

export class MedicineAvailabilityCheckDto {
  @ApiProperty({ description: 'CUID of the facility' })
  @IsString()
  @IsNotEmpty()
  facilityId: string;

  @ApiProperty({ description: 'CUID of the medicine to check' })
  @IsString()
  @IsNotEmpty()
  medicineId: string;
}

export class StaleInventoryQueryDto {
  @ApiPropertyOptional({ description: 'Filter by facility CUID' })
  @IsString()
  @IsOptional()
  facilityId?: string;

  @ApiPropertyOptional({ description: 'Filter by district' })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiPropertyOptional({
    description: 'Freshness threshold in minutes (defaults to configured 120 minutes)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  thresholdMinutes?: number;
}

export class PrescriptionItemCheckDto {
  @ApiProperty({ description: 'CUID of the medicine' })
  @IsString()
  @IsNotEmpty()
  medicineId: string;

  @ApiProperty({ example: 10, description: 'Quantity needed for the prescription' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class PrescriptionAvailabilityCheckDto {
  @ApiProperty({ description: 'CUID of the facility where prescription will be dispensed' })
  @IsString()
  @IsNotEmpty()
  facilityId: string;

  @ApiProperty({
    type: [PrescriptionItemCheckDto],
    description: 'List of medicines and quantities to verify',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemCheckDto)
  items: PrescriptionItemCheckDto[];
}

export class ImportInventoryRowDto {
  @ApiProperty({
    example: 1,
    description: 'Row index or row number from the source file for error tracking',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rowNumber: number;

  @ApiPropertyOptional({ description: 'Medicine CUID if known' })
  @IsString()
  @IsOptional()
  medicineId?: string;

  @ApiPropertyOptional({ example: 'Paracetamol 500mg' })
  @IsString()
  @IsOptional()
  medicineName?: string;

  @ApiPropertyOptional({ example: 'Paracetamol' })
  @IsString()
  @IsOptional()
  genericName?: string;

  @ApiPropertyOptional({ example: '500mg' })
  @IsString()
  @IsOptional()
  strength?: string;

  @ApiPropertyOptional({ example: 'TABLET' })
  @IsString()
  @IsOptional()
  dosageForm?: string;

  @ApiProperty({ example: 100, description: 'Quantity to intake (must be >= 1)' })
  @Type(() => Number)
  @IsOptional()
  quantity: number;

  @ApiPropertyOptional({ example: 'tablets' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ example: 'BATCH-2026-X1' })
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional({ example: '2028-12-31T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ example: 'District Supply Depot' })
  @IsString()
  @IsOptional()
  supplier?: string;

  @ApiPropertyOptional({ example: 'INV-IMPORT-001' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;
}

export class ImportInventoryDto {
  @ApiProperty({ description: 'CUID of the facility receiving the imported inventory' })
  @IsString()
  @IsNotEmpty()
  facilityId: string;

  @ApiPropertyOptional({
    example: 'import-batch-2026-09-08-001',
    description: 'Client-generated idempotency key for safe retry over weak 2G network',
  })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @ApiProperty({
    type: [ImportInventoryRowDto],
    description: 'Array of validated structured rows parsed from spreadsheet/CSV/Excel',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportInventoryRowDto)
  rows: ImportInventoryRowDto[];
}
