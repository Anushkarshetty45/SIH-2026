import { IsEnum, IsNotEmpty, IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek, SlotStatus } from '@prisma/client';

export class CreateScheduleDto {
  @ApiProperty() @IsString() @IsNotEmpty() facilityId: string;
  @ApiProperty({ enum: DayOfWeek }) @IsEnum(DayOfWeek) dayOfWeek: DayOfWeek;
  @ApiProperty({ example: '09:00' }) @IsString() @IsNotEmpty() startTime: string;
  @ApiProperty({ example: '17:00' }) @IsString() @IsNotEmpty() endTime: string;
  @ApiPropertyOptional({ default: 15 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(120)
  slotDurationMinutes?: number;
}

export class GenerateSlotsDto {
  @ApiProperty({ example: '2026-09-15', description: 'ISO date YYYY-MM-DD' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty() @IsString() @IsNotEmpty() facilityId: string;
}

export class UpdateSlotDto {
  @ApiProperty({ enum: [SlotStatus.BLOCKED, SlotStatus.AVAILABLE] })
  @IsEnum(SlotStatus)
  status: SlotStatus;
}
