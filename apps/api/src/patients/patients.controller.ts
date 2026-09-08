import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto, UpdateConsentDto } from './dto/patient.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles(
    UserRole.ASHA_WORKER,
    UserRole.PHC_STAFF,
    UserRole.DOCTOR,
    UserRole.HOSPITAL_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Register a patient — ABHA ID is optional' })
  create(@Body() dto: CreatePatientDto, @CurrentUser('id') userId: string) {
    return this.patientsService.create(dto, userId);
  }

  @Get()
  @Roles(UserRole.PHC_STAFF, UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List patients (paginated)' })
  list(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.patientsService.list(+page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by local ID' })
  findOne(@Param('id') id: string) {
    return this.patientsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update patient record' })
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(id, dto);
  }

  @Patch(':id/consent')
  @ApiOperation({
    summary: 'Update patient consent status',
    description:
      'ABHA identity and health-record access are separate — consent must be explicitly granted.',
  })
  updateConsent(@Param('id') id: string, @Body() dto: UpdateConsentDto) {
    return this.patientsService.updateConsent(id, dto);
  }
}
