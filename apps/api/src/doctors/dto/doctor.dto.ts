import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDoctorDto {
  @ApiProperty({ description: 'User ID to link as doctor' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  facilityId: string;

  @ApiProperty({ example: 'General Medicine' })
  @IsString()
  @IsNotEmpty()
  specialization: string;

  @ApiProperty({ example: 'MH-12345' })
  @IsString()
  @IsNotEmpty()
  registrationNo: string;
}

export class UpdateDoctorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  facilityId?: string;
}
