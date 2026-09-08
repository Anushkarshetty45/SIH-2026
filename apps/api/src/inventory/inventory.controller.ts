import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { InventoryService } from './inventory.service';
import {
  StockIntakeDto,
  StockAdjustmentDto,
  InventoryQueryDto,
  StaleInventoryQueryDto,
  PrescriptionAvailabilityCheckDto,
  ImportInventoryDto,
} from './dto/inventory.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('inventory/intake')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.FACILITY_STAFF, UserRole.PHC_STAFF)
  @ApiOperation({
    summary: 'Record stock intake/receipt for a facility (atomically increments balance)',
  })
  @ApiResponse({ status: 201, description: 'Stock received and logged' })
  @ApiResponse({ status: 404, description: 'Facility or Medicine not found' })
  recordIntake(@Body() dto: StockIntakeDto, @CurrentUser('id') userId?: string) {
    return this.inventoryService.recordIntake(dto, userId);
  }

  @Post('inventory/adjust')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.FACILITY_STAFF, UserRole.PHC_STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Concurrency-safe stock adjustment (ISSUE/decrement, RECEIPT/increment, or physical count sync)',
  })
  @ApiResponse({ status: 200, description: 'Stock adjusted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Insufficient stock or invalid transaction parameter',
  })
  @ApiResponse({ status: 404, description: 'Stock record not found' })
  adjustStock(@Body() dto: StockAdjustmentDto, @CurrentUser('id') userId?: string) {
    return this.inventoryService.adjustStock(dto, userId);
  }

  @Get('inventory/check')
  @ApiOperation({
    summary:
      'Check medicine availability at a facility with deterministic alternatives (prescription-time)',
  })
  @ApiQuery({ name: 'facilityId', description: 'Facility CUID' })
  @ApiQuery({ name: 'medicineId', description: 'Medicine CUID' })
  @ApiResponse({
    status: 200,
    description: 'Availability status, current stock, freshness, and alternatives',
  })
  @ApiResponse({ status: 404, description: 'Medicine not found' })
  checkAvailability(
    @Query('facilityId') facilityId: string,
    @Query('medicineId') medicineId: string,
  ) {
    return this.inventoryService.checkAvailability(facilityId, medicineId);
  }

  @Get('inventory/stale')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({
    summary: 'Domain escalation detection: Query stale facility inventories (> threshold)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of facilities with stale inventory for D3 escalation',
  })
  getStaleInventory(@Query() query: StaleInventoryQueryDto) {
    return this.inventoryService.getStaleInventory(query);
  }

  @Get('facilities/:facilityId/inventory')
  @ApiOperation({
    summary: 'Get facility inventory list with summary statistics and staleness',
  })
  @ApiParam({ name: 'facilityId', description: 'Facility CUID' })
  @ApiResponse({
    status: 200,
    description: 'Paginated inventory items and facility freshness summary',
  })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  getFacilityInventory(@Param('facilityId') facilityId: string, @Query() query: InventoryQueryDto) {
    return this.inventoryService.getFacilityInventory(facilityId, query);
  }

  @Get('facilities/:facilityId/inventory/:medicineId')
  @ApiOperation({
    summary: 'Get single medicine stock at a facility with recent transaction history',
  })
  @ApiParam({ name: 'facilityId', description: 'Facility CUID' })
  @ApiParam({ name: 'medicineId', description: 'Medicine CUID' })
  @ApiResponse({ status: 200, description: 'Medicine stock and transactions' })
  @ApiResponse({ status: 404, description: 'Stock record not found' })
  getFacilityMedicineStock(
    @Param('facilityId') facilityId: string,
    @Param('medicineId') medicineId: string,
  ) {
    return this.inventoryService.getFacilityMedicineStock(facilityId, medicineId);
  }

  @Post('inventory/check-prescription')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Prescription-time multi-item medicine availability check with deterministic alternative options',
  })
  @ApiResponse({
    status: 200,
    description: 'Multi-item fulfillment status, item breakdown, and deterministic alternatives',
  })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  checkPrescriptionAvailability(@Body() dto: PrescriptionAvailabilityCheckDto) {
    return this.inventoryService.checkPrescriptionAvailability(dto);
  }

  @Post('inventory/import')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.FACILITY_STAFF, UserRole.PHC_STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Structured batch inventory import with row-level validation, error reporting, and 2G retry idempotency',
  })
  @ApiResponse({
    status: 200,
    description:
      'Batch processing summary with processed, successful, failed counts and row-level error breakdown',
  })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  importInventory(@Body() dto: ImportInventoryDto, @CurrentUser('id') userId?: string) {
    return this.inventoryService.importInventory(dto, userId);
  }
}
