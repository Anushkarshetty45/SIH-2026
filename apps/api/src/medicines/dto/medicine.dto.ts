import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateMedicineDto {
  @ApiProperty({ example: 'Paracetamol 500mg' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Paracetamol' })
  @IsString()
  @IsNotEmpty()
  genericName: string;

  @ApiProperty({
    example: 'TABLET',
    description: 'TABLET, SYRUP, INJECTION, CAPSULE, OINTMENT, etc.',
  })
  @IsString()
  @IsNotEmpty()
  dosageForm: string;

  @ApiProperty({ example: '500mg' })
  @IsString()
  @IsNotEmpty()
  strength: string;

  @ApiPropertyOptional({ example: 'Analgesic / Antipyretic' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 'Cipla Ltd.' })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({ example: 'tablets', default: 'tablets' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ example: 'For relief of mild to moderate pain and fever' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateMedicineDto {
  @ApiPropertyOptional({ example: 'Paracetamol 500mg' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Paracetamol' })
  @IsString()
  @IsOptional()
  genericName?: string;

  @ApiPropertyOptional({ example: 'TABLET' })
  @IsString()
  @IsOptional()
  dosageForm?: string;

  @ApiPropertyOptional({ example: '500mg' })
  @IsString()
  @IsOptional()
  strength?: string;

  @ApiPropertyOptional({ example: 'Analgesic' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 'Cipla Ltd.' })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({ example: 'tablets' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ example: 'For relief of mild to moderate pain and fever' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class MedicineQueryDto {
  @ApiPropertyOptional({ description: 'Search term for name or genericName' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by generic name' })
  @IsString()
  @IsOptional()
  genericName?: string;

  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsString()
  @IsOptional()
  category?: string;

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

export class CreateAlternativeDto {
  @ApiProperty({ description: 'CUID of the alternative medicine' })
  @IsString()
  @IsNotEmpty()
  alternativeMedicineId: string;

  @ApiPropertyOptional({ example: 'Direct therapeutic equivalent with identical bio-availability' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class AlternativeQueryDto {
  @ApiPropertyOptional({
    description: 'Optional facility CUID to check stock availability of alternatives',
  })
  @IsString()
  @IsOptional()
  facilityId?: string;
}
