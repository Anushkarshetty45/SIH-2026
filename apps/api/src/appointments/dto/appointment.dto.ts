import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';

export class BookAppointmentDto {
  @ApiProperty({ description: 'ID of the patient' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ description: 'ID of the slot to book' })
  @IsString()
  @IsNotEmpty()
  slotId: string;

  @ApiPropertyOptional({ description: 'Optional referral ID linked to this appointment' })
  @IsOptional()
  @IsString()
  referralId?: string;

  @ApiPropertyOptional({ description: 'Clinical or visit notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @ApiPropertyOptional({ description: 'Reason for cancellation or update' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AppointmentQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  facilityId?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: number;
}
