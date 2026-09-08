import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { PullSyncDto, PushSyncDto } from './dto/sync.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('pull')
  @ApiOperation({
    summary: 'Pull delta updates since a specified timestamp (optimized for 2G / edge nodes)',
  })
  async pull(@Query() query: PullSyncDto) {
    return this.syncService.pull(query);
  }

  @Post('push')
  @ApiOperation({
    summary: 'Push batch offline mutations from mobile or Raspberry Pi edge devices',
  })
  async push(@Body() dto: PushSyncDto, @CurrentUser() user: User) {
    return this.syncService.push(dto, user.id);
  }
}
