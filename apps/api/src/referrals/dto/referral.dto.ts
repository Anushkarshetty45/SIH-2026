import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReferralStatus } from '@prisma/client';

export class CreateReferralDto {
  @ApiProperty() @IsString() @IsNotEmpty() patientId: string;
  @ApiProperty() @IsString() @IsNotEmpty() fromFacilityId: string;
  @ApiProperty() @IsString() @IsNotEmpty() toFacilityId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() receivingDoctorId?: string;
  @ApiPropertyOptional({ example: 'NORMAL', enum: ['NORMAL', 'HIGH', 'EMERGENCY'] })
  @IsOptional()
  @IsString()
  urgency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() clinicalNotes?: string;
}

export class RespondReferralDto {
  @ApiProperty({ enum: ReferralStatus })
  @IsEnum(ReferralStatus)
  status: ReferralStatus;

  @ApiPropertyOptional({ description: 'Required when rejecting' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class CancelReferralDto {
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

export class ReferralQueryDto {
  @ApiPropertyOptional({ enum: ReferralStatus })
  @IsOptional()
  @IsEnum(ReferralStatus)
  status?: ReferralStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() patientId?: string;
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
}
