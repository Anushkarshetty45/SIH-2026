import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsentStatus, Language } from '@prisma/client';

export class CreatePatientDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateOfBirth?: string;
  @ApiPropertyOptional({ example: 'MALE' }) @IsOptional() @IsString() gender?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() district?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  /** ABHA ID is always optional */
  @ApiPropertyOptional({ description: 'ABHA ID — optional; patient can be registered without it' })
  @IsOptional()
  @IsString()
  abhaId?: string;
  @ApiPropertyOptional({ enum: Language })
  @IsOptional()
  @IsEnum(Language)
  preferredLanguage?: Language;
}

export class UpdatePatientDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() abhaId?: string;
  @ApiPropertyOptional({ enum: Language })
  @IsOptional()
  @IsEnum(Language)
  preferredLanguage?: Language;
}

export class UpdateConsentDto {
  @ApiProperty({ enum: ConsentStatus }) @IsEnum(ConsentStatus) consentStatus: ConsentStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() purpose?: string;
}
