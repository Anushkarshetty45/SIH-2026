import { Controller, Get, Post, Query, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FreshnessService } from './freshness.service';
import { StaleRecordsQueryDto, StaleEscalationQueryDto } from './dto/freshness.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('freshness')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('freshness')
export class FreshnessController {
  constructor(private readonly freshnessService: FreshnessService) {}

  @Get('facility/:facilityId')
  @ApiOperation({
    summary: 'Get unified freshness profile for a facility (beds, equipment, inventory)',
    description:
      'Calculates server-side staleness and life-critical reliability warnings according to SRS Rule 11.',
  })
  async getFacilityFreshness(@Param('facilityId') facilityId: string) {
    return this.freshnessService.getFacilityFreshness(facilityId);
  }

  @Get('stale-records')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.FACILITY_STAFF,
    UserRole.PHC_STAFF,
    UserRole.DOCTOR,
  )
  @ApiOperation({
    summary: 'Query stale records across beds, equipment, and inventory',
    description:
      'Filterable by resourceType (ALL, BEDS, EQUIPMENT, INVENTORY), district, and threshold.',
  })
  async getStaleRecords(@Query() query: StaleRecordsQueryDto) {
    return this.freshnessService.getStaleRecords(query);
  }

  @Get('escalations')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.PHC_STAFF)
  @ApiOperation({
    summary: 'Domain Escalation Batches for Developer 3 (BullMQ/Scheduler/Notification service)',
    description:
      'Identifies facilities with stale operational data and segments them into Tier 1 (Facility Admin) and Tier 2 (District Officer) escalation batches.',
  })
  async getEscalations(@Query() query: StaleEscalationQueryDto) {
    return this.freshnessService.getStaleEscalationBatches(query.thresholdMinutes, query.district);
  }

  @Post('trigger-events')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary: 'Emit domain escalation events to NotificationsService for D3 integration',
  })
  @ApiQuery({ name: 'district', required: false, type: String })
  async triggerDomainEvents(@Query('district') district?: string) {
    return this.freshnessService.emitStaleDomainEvents(district);
  }
}
