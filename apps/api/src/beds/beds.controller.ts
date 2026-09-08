import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BedsService } from './beds.service';
import { CreateBedDto, BatchCreateBedsDto, UpdateBedStatusDto, BedQueryDto } from './dto/bed.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';

@ApiTags('beds')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class BedsController {
  constructor(private readonly bedsService: BedsService) {}

  @Post('beds')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.FACILITY_STAFF, UserRole.PHC_STAFF)
  @ApiOperation({ summary: 'Register a new bed in a facility' })
  async create(@Body() dto: CreateBedDto, @CurrentUser() user: User) {
    return this.bedsService.create(dto, user.id);
  }

  @Post('beds/batch')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.FACILITY_STAFF, UserRole.PHC_STAFF)
  @ApiOperation({ summary: 'Batch instantiate beds for a ward/category' })
  async batchCreate(@Body() dto: BatchCreateBedsDto, @CurrentUser() user: User) {
    return this.bedsService.batchCreate(dto, user.id);
  }

  @Patch('beds/:id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.FACILITY_STAFF,
    UserRole.PHC_STAFF,
    UserRole.DOCTOR,
  )
  @ApiOperation({
    summary: 'Update bed status (AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE, UNAVAILABLE)',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBedStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.bedsService.updateStatus(id, dto, user.id);
  }

  @Get('beds')
  @ApiOperation({ summary: 'List beds with optional filters and pagination' })
  async list(@Query() query: BedQueryDto) {
    return this.bedsService.list(query);
  }

  @Get('beds/stale')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.PHC_STAFF)
  @ApiOperation({ summary: 'Find facilities with stale bed availability data (for escalation)' })
  @ApiQuery({ name: 'thresholdMinutes', required: false, type: Number })
  async getStale(@Query('thresholdMinutes') thresholdMinutes?: number) {
    return this.bedsService.getStaleFacilities(
      thresholdMinutes ? Number(thresholdMinutes) : undefined,
    );
  }

  @Get('beds/emergency-availability')
  @ApiOperation({
    summary:
      'Emergency bed availability query (ICU/Oxygen/Ventilator) with conservative freshness flags',
    description:
      'Returns live emergency bed counts. If data is stale, flags unreliableForEmergency=true with human re-verification warnings.',
  })
  @ApiQuery({ name: 'facilityId', required: false, type: String })
  @ApiQuery({ name: 'district', required: false, type: String })
  async getEmergencyAvailability(
    @Query('facilityId') facilityId?: string,
    @Query('district') district?: string,
  ) {
    return this.bedsService.getEmergencyBedAvailability(facilityId, district);
  }

  @Get('beds/:id')
  @ApiOperation({ summary: 'Get bed details by ID' })
  async findById(@Param('id') id: string) {
    return this.bedsService.findById(id);
  }

  @Get('facilities/:facilityId/beds')
  @ApiOperation({
    summary: 'Get facility bed capacity, availability by category, and data freshness',
  })
  async getFacilityBedSummary(@Param('facilityId') facilityId: string) {
    return this.bedsService.getFacilityBedSummary(facilityId);
  }
}
