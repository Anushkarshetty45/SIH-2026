import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Language } from '@prisma/client';

export class UpdateLanguageDto {
  @ApiPropertyOptional({ enum: Language })
  @IsEnum(Language)
  preferredLanguage: Language;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  phone?: string;
}
