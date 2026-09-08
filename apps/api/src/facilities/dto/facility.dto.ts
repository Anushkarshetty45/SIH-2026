import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FacilityType, FacilityStatus } from '@prisma/client';

export class CreateFacilityDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty({ enum: FacilityType }) @IsEnum(FacilityType) type: FacilityType;
  @ApiProperty() @IsString() @IsNotEmpty() address: string;
  @ApiProperty() @IsString() @IsNotEmpty() district: string;
  @ApiProperty() @IsString() @IsNotEmpty() state: string;
  @ApiProperty() @IsString() @IsNotEmpty() pincode: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() latitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() longitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() contactPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() adminId?: string;
}

export class UpdateFacilityDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional({ enum: FacilityStatus })
  @IsOptional()
  @IsEnum(FacilityStatus)
  status?: FacilityStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() latitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() longitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() adminId?: string;
}

export class FacilityQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() district?: string;
  @ApiPropertyOptional({ enum: FacilityType })
  @IsOptional()
  @IsEnum(FacilityType)
  type?: FacilityType;
  @ApiPropertyOptional({ enum: FacilityStatus })
  @IsOptional()
  @IsEnum(FacilityStatus)
  status?: FacilityStatus;
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
}
