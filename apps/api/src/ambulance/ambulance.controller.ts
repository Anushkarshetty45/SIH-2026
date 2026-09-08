import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AmbulanceService } from './ambulance.service';
import {
  CreateAmbulanceDto,
  UpdateAmbulanceDto,
  DispatchAmbulanceDto,
  UpdateTransportStatusDto,
} from './dto/ambulance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole, TransportStatus } from '@prisma/client';

@ApiTags('ambulance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ambulance')
export class AmbulanceController {
  constructor(private readonly ambulanceService: AmbulanceService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Register an ambulance vehicle' })
  async createAmbulance(@Body() dto: CreateAmbulanceDto, @CurrentUser() user: User) {
    return this.ambulanceService.createAmbulance(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all ambulances with optional filters' })
  @ApiQuery({ name: 'facilityId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async listAmbulances(
    @Query('facilityId') facilityId?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.ambulanceService.listAmbulances(
      facilityId,
      isActive !== undefined ? String(isActive) === 'true' : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ambulance details by ID' })
  async findAmbulanceById(@Param('id') id: string) {
    return this.ambulanceService.findAmbulanceById(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.AMBULANCE_STAFF)
  @ApiOperation({ summary: 'Update ambulance details or availability status' })
  async updateAmbulance(
    @Param('id') id: string,
    @Body() dto: UpdateAmbulanceDto,
    @CurrentUser() user: User,
  ) {
    return this.ambulanceService.updateAmbulance(id, dto, user.id);
  }

  @Post('dispatch')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.FACILITY_STAFF,
    UserRole.DOCTOR,
    UserRole.PHC_STAFF,
    UserRole.ASHA_WORKER,
  )
  @ApiOperation({ summary: 'Dispatch an ambulance for emergency transport' })
  async dispatch(@Body() dto: DispatchAmbulanceDto, @CurrentUser() user: User) {
    return this.ambulanceService.dispatch(dto, user.id);
  }

  @Get('transports/all')
  @ApiOperation({ summary: 'List emergency transport requests' })
  @ApiQuery({ name: 'status', required: false, enum: TransportStatus })
  @ApiQuery({ name: 'ambulanceId', required: false, type: String })
  async listTransports(
    @Query('status') status?: TransportStatus,
    @Query('ambulanceId') ambulanceId?: string,
  ) {
    return this.ambulanceService.listTransports(status, ambulanceId);
  }

  @Get('transports/:id')
  @ApiOperation({ summary: 'Get emergency transport details by ID' })
  async findTransportById(@Param('id') id: string) {
    return this.ambulanceService.findTransportById(id);
  }

  @Patch('transports/:id/status')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.AMBULANCE_STAFF,
    UserRole.FACILITY_STAFF,
  )
  @ApiOperation({
    summary: 'Update transport status (DISPATCHED, EN_ROUTE, ARRIVED, COMPLETED, CANCELLED)',
  })
  async updateTransportStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTransportStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.ambulanceService.updateTransportStatus(id, dto, user.id);
  }
}
