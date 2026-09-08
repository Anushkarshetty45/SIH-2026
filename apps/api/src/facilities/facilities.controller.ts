import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { FacilitiesService } from './facilities.service';
import { CreateFacilityDto, UpdateFacilityDto, FacilityQueryDto } from './dto/facility.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('facilities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('facilities')
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Create a new facility' })
  create(@Body() dto: CreateFacilityDto) {
    return this.facilitiesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List facilities with optional filters' })
  list(@Query() query: FacilityQueryDto) {
    return this.facilitiesService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a facility by ID' })
  findOne(@Param('id') id: string) {
    return this.facilitiesService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Update a facility' })
  update(@Param('id') id: string, @Body() dto: UpdateFacilityDto) {
    return this.facilitiesService.update(id, dto);
  }

  @Get(':id/availability')
  @ApiOperation({
    summary: 'Get facility availability with freshness indicator',
    description:
      'Returns isStale=true if data is older than the configured threshold. Clients must not display stale data as current.',
  })
  getAvailability(@Param('id') id: string) {
    return this.facilitiesService.getAvailability(id);
  }
}
