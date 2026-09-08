import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BedCategory, BedStatus } from '@prisma/client';

export class CreateBedDto {
  @ApiProperty({ description: 'ID of the healthcare facility' })
  @IsString()
  @IsNotEmpty()
  facilityId: string;

  @ApiProperty({
    description: 'Unique identifier or number of the bed in the facility',
    example: 'ICU-B01',
  })
  @IsString()
  @IsNotEmpty()
  bedNumber: string;

  @ApiProperty({ description: 'Ward name or department', example: 'Emergency Ward A' })
  @IsString()
  @IsNotEmpty()
  ward: string;

  @ApiPropertyOptional({ enum: BedCategory, default: BedCategory.GENERAL })
  @IsOptional()
  @IsEnum(BedCategory)
  category?: BedCategory;

  @ApiPropertyOptional({ enum: BedStatus, default: BedStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(BedStatus)
  status?: BedStatus;
}

export class BatchCreateBedsDto {
  @ApiProperty({ description: 'ID of the healthcare facility' })
  @IsString()
  @IsNotEmpty()
  facilityId: string;

  @ApiProperty({ description: 'Ward name or department', example: 'General Ward' })
  @IsString()
  @IsNotEmpty()
  ward: string;

  @ApiProperty({ enum: BedCategory, example: BedCategory.GENERAL })
  @IsEnum(BedCategory)
  category: BedCategory;

  @ApiProperty({ description: 'Prefix for bed numbers', example: 'GW-' })
  @IsString()
  @IsNotEmpty()
  prefix: string;

  @ApiProperty({ description: 'Number of beds to instantiate', example: 10 })
  @IsInt()
  @Min(1)
  @Max(100)
  count: number;
}

export class UpdateBedStatusDto {
  @ApiProperty({ enum: BedStatus, example: BedStatus.OCCUPIED })
  @IsEnum(BedStatus)
  status: BedStatus;
}

export class BedQueryDto {
  @ApiPropertyOptional({ description: 'Filter by facility ID' })
  @IsOptional()
  @IsString()
  facilityId?: string;

  @ApiPropertyOptional({ description: 'Filter by ward name' })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional({ enum: BedCategory })
  @IsOptional()
  @IsEnum(BedCategory)
  category?: BedCategory;

  @ApiPropertyOptional({ enum: BedStatus })
  @IsOptional()
  @IsEnum(BedStatus)
  status?: BedStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  limit?: number;
}
