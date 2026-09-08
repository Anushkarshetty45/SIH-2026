import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionAvailabilityCheckDto } from '../inventory/dto/inventory.dto';

@ApiTags('prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post('check-availability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Prescription-time multi-item medicine availability check with deterministic alternatives',
  })
  @ApiResponse({
    status: 200,
    description: 'Prescription fulfillment evaluation and deterministic alternative options',
  })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  checkAvailability(@Body() dto: PrescriptionAvailabilityCheckDto) {
    return this.prescriptionsService.checkAvailability(dto);
  }
}
