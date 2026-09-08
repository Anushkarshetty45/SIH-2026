import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import {
  BookAppointmentDto,
  UpdateAppointmentStatusDto,
  AppointmentQueryDto,
} from './dto/appointment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(
    UserRole.ASHA_WORKER,
    UserRole.PHC_STAFF,
    UserRole.DOCTOR,
    UserRole.FACILITY_STAFF,
    UserRole.HOSPITAL_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Book an appointment (concurrency-safe with pessimistic locking)' })
  async book(@Body() dto: BookAppointmentDto, @CurrentUser() user: User) {
    return this.appointmentsService.book(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List appointments with filtering and pagination' })
  async list(@Query() query: AppointmentQueryDto) {
    return this.appointmentsService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment details by ID' })
  async findById(@Param('id') id: string) {
    return this.appointmentsService.findById(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.DOCTOR, UserRole.FACILITY_STAFF, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update appointment status (CONFIRMED, COMPLETED, NO_SHOW, CANCELLED)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.appointmentsService.updateStatus(id, dto, user.id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an appointment and free the reserved slot' })
  async cancel(@Param('id') id: string, @Body('reason') reason: string, @CurrentUser() user: User) {
    return this.appointmentsService.cancel(id, reason, user.id);
  }
}
