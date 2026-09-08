import { Injectable } from '@nestjs/common';
import { InventoryService } from '../inventory/inventory.service';
import { PrescriptionAvailabilityCheckDto } from '../inventory/dto/inventory.dto';

@Injectable()
export class PrescriptionsService {
  constructor(private readonly inventoryService: InventoryService) {}

  async checkAvailability(dto: PrescriptionAvailabilityCheckDto) {
    return this.inventoryService.checkPrescriptionAvailability(dto);
  }
}
