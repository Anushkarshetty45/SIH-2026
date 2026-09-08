import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto, UpdateEquipmentDto, EquipmentQueryDto } from './dto/equipment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';

@ApiTags('equipment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post('equipment')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.FACILITY_STAFF, UserRole.PHC_STAFF)
  @ApiOperation({ summary: 'Register medical equipment at a facility' })
  async create(@Body() dto: CreateEquipmentDto, @CurrentUser() user: User) {
    return this.equipmentService.create(dto, user.id);
  }

  @Patch('equipment/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.FACILITY_STAFF, UserRole.PHC_STAFF)
  @ApiOperation({ summary: 'Update equipment availability, quantities, or operational status' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEquipmentDto,
    @CurrentUser() user: User,
  ) {
    return this.equipmentService.update(id, dto, user.id);
  }

  @Get('equipment')
  @ApiOperation({ summary: 'List equipment with optional filters' })
  async list(@Query() query: EquipmentQueryDto) {
    return this.equipmentService.list(query);
  }

  @Get('equipment/stale')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.PHC_STAFF)
  @ApiOperation({ summary: 'Find facilities with stale equipment data (for escalation)' })
  @ApiQuery({ name: 'thresholdMinutes', required: false, type: Number })
  async getStale(@Query('thresholdMinutes') thresholdMinutes?: number) {
    return this.equipmentService.getStaleEquipment(
      thresholdMinutes ? Number(thresholdMinutes) : undefined,
    );
  }

  @Get('equipment/:id')
  @ApiOperation({ summary: 'Get equipment details by ID' })
  async findById(@Param('id') id: string) {
    return this.equipmentService.findById(id);
  }

  @Get('facilities/:facilityId/equipment')
  @ApiOperation({ summary: 'Get all equipment for a facility including freshness status' })
  async getFacilityEquipment(@Param('facilityId') facilityId: string) {
    return this.equipmentService.getFacilityEquipment(facilityId);
  }
}
