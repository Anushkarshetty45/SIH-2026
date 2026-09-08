import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EquipmentStatus } from '@prisma/client';

export class CreateEquipmentDto {
  @ApiProperty({ description: 'ID of the healthcare facility' })
  @IsString()
  @IsNotEmpty()
  facilityId: string;

  @ApiProperty({
    description: 'Name or label of the medical equipment',
    example: 'Oxygen Concentrator 10L',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Medical equipment category/type', example: 'Respiratory Support' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ description: 'Total units installed/owned', example: 5, default: 1 })
  @IsInt()
  @Min(1)
  totalQuantity: number;

  @ApiProperty({ description: 'Currently functional and available units', example: 4, default: 1 })
  @IsInt()
  @Min(0)
  availableQuantity: number;

  @ApiPropertyOptional({ enum: EquipmentStatus, default: EquipmentStatus.OPERATIONAL })
  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;
}

export class UpdateEquipmentDto {
  @ApiPropertyOptional({ example: 'Oxygen Concentrator 10L' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Respiratory Support' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalQuantity?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(0)
  availableQuantity?: number;

  @ApiPropertyOptional({ enum: EquipmentStatus })
  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;
}

export class EquipmentQueryDto {
  @ApiPropertyOptional({ description: 'Filter by facility ID' })
  @IsOptional()
  @IsString()
  facilityId?: string;

  @ApiPropertyOptional({ description: 'Filter by equipment category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: EquipmentStatus })
  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  limit?: number;
}
