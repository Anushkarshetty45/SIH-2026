import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AvailabilityService } from './availability.service';
import { CreateScheduleDto, GenerateSlotsDto, UpdateSlotDto } from './dto/availability.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('availability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post('doctors/:doctorId/schedules')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.FACILITY_STAFF)
  @ApiOperation({ summary: 'Create or update a weekly recurring schedule for a doctor' })
  createSchedule(@Param('doctorId') doctorId: string, @Body() dto: CreateScheduleDto) {
    return this.availabilityService.createSchedule(doctorId, dto);
  }

  @Get('doctors/:doctorId/schedules')
  @ApiOperation({ summary: 'Get weekly schedules for a doctor' })
  getSchedules(@Param('doctorId') doctorId: string) {
    return this.availabilityService.getSchedules(doctorId);
  }

  @Post('doctors/:doctorId/slots/generate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.FACILITY_STAFF)
  @ApiOperation({ summary: 'Generate appointment slots from the doctor schedule for a given date' })
  generateSlots(@Param('doctorId') doctorId: string, @Body() dto: GenerateSlotsDto) {
    return this.availabilityService.generateSlots(doctorId, dto);
  }

  @Get('doctors/:doctorId/slots')
  @ApiOperation({ summary: 'Get available slots for a doctor on a date' })
  @ApiQuery({ name: 'date', required: true, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'facilityId', required: false })
  getSlots(
    @Param('doctorId') doctorId: string,
    @Query('date') date: string,
    @Query('facilityId') facilityId?: string,
  ) {
    return this.availabilityService.getSlots(doctorId, date, facilityId);
  }

  @Patch('slots/:slotId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR, UserRole.FACILITY_STAFF)
  @ApiOperation({ summary: 'Block or unblock an appointment slot' })
  updateSlot(@Param('slotId') slotId: string, @Body() dto: UpdateSlotDto) {
    return this.availabilityService.updateSlot(slotId, dto);
  }
}
