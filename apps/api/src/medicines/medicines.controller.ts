import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { MedicinesService } from './medicines.service';
import {
  CreateMedicineDto,
  UpdateMedicineDto,
  MedicineQueryDto,
  CreateAlternativeDto,
  AlternativeQueryDto,
} from './dto/medicine.dto';

@ApiTags('Medicines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('medicines')
export class MedicinesController {
  constructor(private readonly medicinesService: MedicinesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.FACILITY_STAFF, UserRole.PHC_STAFF)
  @ApiOperation({ summary: 'Register a new medicine in the master catalog' })
  @ApiResponse({ status: 201, description: 'Medicine registered successfully' })
  @ApiResponse({ status: 409, description: 'Medicine already exists' })
  create(@Body() dto: CreateMedicineDto) {
    return this.medicinesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search and query the medicine master catalog' })
  @ApiResponse({ status: 200, description: 'Paginated list of medicines' })
  findAll(@Query() query: MedicineQueryDto) {
    return this.medicinesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific medicine by ID' })
  @ApiParam({ name: 'id', description: 'Medicine CUID' })
  @ApiResponse({ status: 200, description: 'Medicine details' })
  @ApiResponse({ status: 404, description: 'Medicine not found' })
  findOne(@Param('id') id: string) {
    return this.medicinesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.FACILITY_STAFF, UserRole.PHC_STAFF)
  @ApiOperation({ summary: 'Update medicine catalog details' })
  @ApiParam({ name: 'id', description: 'Medicine CUID' })
  @ApiResponse({ status: 200, description: 'Medicine updated successfully' })
  @ApiResponse({ status: 404, description: 'Medicine not found' })
  update(@Param('id') id: string, @Body() dto: UpdateMedicineDto) {
    return this.medicinesService.update(id, dto);
  }

  @Post(':id/alternatives')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.FACILITY_STAFF, UserRole.PHC_STAFF)
  @ApiOperation({ summary: 'Register a controlled deterministic alternative for a medicine' })
  @ApiParam({ name: 'id', description: 'Primary Medicine CUID' })
  @ApiResponse({ status: 201, description: 'Alternative linked successfully' })
  @ApiResponse({ status: 400, description: 'Invalid alternative link (e.g. self-link)' })
  @ApiResponse({ status: 404, description: 'Medicine not found' })
  addAlternative(@Param('id') id: string, @Body() dto: CreateAlternativeDto) {
    return this.medicinesService.addAlternative(id, dto);
  }

  @Get(':id/alternatives')
  @ApiOperation({
    summary:
      'Get controlled alternatives and deterministic generic equivalents for a medicine (with optional facility stock)',
  })
  @ApiParam({ name: 'id', description: 'Primary Medicine CUID' })
  @ApiResponse({ status: 200, description: 'Deterministic alternatives and generic equivalents' })
  @ApiResponse({ status: 404, description: 'Medicine not found' })
  getAlternatives(@Param('id') id: string, @Query() query: AlternativeQueryDto) {
    return this.medicinesService.getAlternatives(id, query.facilityId);
  }

  @Delete(':id/alternatives/:altId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.FACILITY_STAFF, UserRole.PHC_STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a controlled alternative mapping' })
  @ApiParam({ name: 'id', description: 'Primary Medicine CUID' })
  @ApiParam({ name: 'altId', description: 'Alternative Medicine CUID' })
  @ApiResponse({ status: 200, description: 'Alternative mapping removed' })
  @ApiResponse({ status: 404, description: 'Alternative mapping not found' })
  removeAlternative(@Param('id') id: string, @Param('altId') altId: string) {
    return this.medicinesService.removeAlternative(id, altId);
  }
}
