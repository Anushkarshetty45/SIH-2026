import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransportStatus } from '@prisma/client';

export class CreateAmbulanceDto {
  @ApiProperty({ example: 'MH-12-AB-1234' })
  @IsString()
  @IsNotEmpty()
  vehicleNumber: string;

  @ApiProperty({ description: 'User ID of the operator/driver' })
  @IsString()
  @IsNotEmpty()
  operatorId: string;

  @ApiPropertyOptional({ description: 'Current facility base ID' })
  @IsOptional()
  @IsString()
  currentFacilityId?: string;
}

export class UpdateAmbulanceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  operatorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentFacilityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class DispatchAmbulanceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ambulanceId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  receivingFacilityId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emergencyDetails?: string;
}

export class UpdateTransportStatusDto {
  @ApiProperty({ enum: TransportStatus })
  @IsEnum(TransportStatus)
  status: TransportStatus;
}
