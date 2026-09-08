import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('doctors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Register a doctor profile (links User to Facility)' })
  create(@Body() dto: CreateDoctorDto) {
    return this.doctorsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List doctors' })
  @ApiQuery({ name: 'facilityId', required: false })
  @ApiQuery({ name: 'specialization', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  list(
    @Query('facilityId') facilityId?: string,
    @Query('specialization') specialization?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    if (facilityId) {
      return this.doctorsService.listByFacility(facilityId, +page, +limit);
    }
    return this.doctorsService.listAll(+page, +limit, specialization);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a doctor by ID' })
  findOne(@Param('id') id: string) {
    return this.doctorsService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Update doctor availability or specialization' })
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    return this.doctorsService.update(id, dto);
  }
}
