import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum StaleResourceFilterType {
  ALL = 'ALL',
  BEDS = 'BEDS',
  EQUIPMENT = 'EQUIPMENT',
  INVENTORY = 'INVENTORY',
}

export class StaleRecordsQueryDto {
  @ApiPropertyOptional({
    enum: StaleResourceFilterType,
    default: StaleResourceFilterType.ALL,
    description: 'Filter by operational resource domain',
  })
  @IsOptional()
  @IsEnum(StaleResourceFilterType)
  resourceType?: StaleResourceFilterType = StaleResourceFilterType.ALL;

  @ApiPropertyOptional({
    description: 'Filter by district (e.g. Pune, Gadchiroli, Nandurbar)',
  })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({
    description: 'Facility ID filter',
  })
  @IsOptional()
  @IsString()
  facilityId?: string;

  @ApiPropertyOptional({
    description: 'Custom threshold in minutes (defaults to configured threshold, e.g. 120)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  thresholdMinutes?: number;
}

export class StaleEscalationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by district',
  })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({
    description: 'Custom threshold in minutes (defaults to 120)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  thresholdMinutes?: number;
}
