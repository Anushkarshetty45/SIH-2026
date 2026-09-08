import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PullSyncDto {
  @ApiPropertyOptional({
    description:
      'ISO-8601 timestamp of last successful sync. Returns all changes since this timestamp.',
  })
  @IsOptional()
  @IsDateString()
  since?: string;

  @ApiPropertyOptional({ description: 'Filter delta by facility ID' })
  @IsOptional()
  @IsString()
  facilityId?: string;
}

export enum SyncEntity {
  PATIENT = 'PATIENT',
  REFERRAL = 'REFERRAL',
  APPOINTMENT = 'APPOINTMENT',
}

export enum SyncAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
}

export class PushMutationDto {
  @ApiProperty({ description: 'Client-generated UUID for idempotency' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ enum: SyncEntity })
  @IsEnum(SyncEntity)
  entity: SyncEntity;

  @ApiProperty({ enum: SyncAction })
  @IsEnum(SyncAction)
  action: SyncAction;

  @ApiProperty({ description: 'Entity payload to persist' })
  @IsObject()
  payload: Record<string, any>;

  @ApiProperty({ description: 'Timestamp when mutation occurred on device/edge node' })
  @IsDateString()
  clientTimestamp: string;
}

export class PushSyncDto {
  @ApiProperty({ type: [PushMutationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PushMutationDto)
  mutations: PushMutationDto[];
}
