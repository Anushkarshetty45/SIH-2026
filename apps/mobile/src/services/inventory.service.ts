// Inventory API Service — integrates with D2 backend /inventory endpoints

import { api } from '../api/client';
import {
  MedicineStock,
  StockTransaction,
  StockTransactionType,
  ControlledAlternative,
  PaginationQuery,
} from '../types';

export interface InventoryQuery extends PaginationQuery {
  search?: string;
  stockStatus?: string;
  lowStockOnly?: boolean;
}

export interface FacilityInventorySummary {
  facilityId: string;
  facilityName: string;
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  lastUpdatedAt: string;
  isStale: boolean;
  staleMinutes: number;
  items: MedicineStock[];
}

export interface AvailabilityCheckResult {
  facilityId: string;
  medicineId: string;
  medicineName: string;
  genericName: string;
  currentStock: number;
  unit: string;
  isAvailable: boolean;
  stockStatus: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  lastUpdatedAt: string;
  isStale: boolean;
  staleMinutes: number;
  alternatives: ControlledAlternative[];
}

export interface PrescriptionCheckItem {
  medicineId: string;
  quantity: number;
}

export interface PrescriptionCheckResult {
  facilityId: string;
  allAvailable: boolean;
  lastUpdatedAt: string;
  isStale: boolean;
  items: Array<{
    medicineId: string;
    medicineName: string;
    requestedQuantity: number;
    currentStock: number;
    isAvailable: boolean;
    alternatives: ControlledAlternative[];
  }>;
}

export interface StockIntakeDto {
  facilityId: string;
  medicineId: string;
  quantity: number;
  batchNumber?: string;
  expiryDate?: string;
  supplier?: string;
  referenceNumber?: string;
  unit?: string;
}

export interface StockAdjustmentDto {
  facilityId: string;
  medicineId: string;
  type: StockTransactionType;
  quantity: number;
  reason?: string;
  batchNumber?: string;
  idempotencyKey?: string;
}

export const inventoryService = {
  /**
   * Get facility inventory list with summary statistics and staleness
   */
  getFacilityInventory: (
    facilityId: string,
    query?: InventoryQuery,
  ): Promise<FacilityInventorySummary> =>
    api.get<FacilityInventorySummary>(`/facilities/${facilityId}/inventory`, {
      params: query,
    }),

  /**
   * Get single medicine stock at a facility with recent transaction history
   */
  getFacilityMedicineStock: (
    facilityId: string,
    medicineId: string,
  ): Promise<{
    stock: MedicineStock;
    transactions: StockTransaction[];
    lastUpdatedAt: string;
    isStale: boolean;
  }> =>
    api.get(`/facilities/${facilityId}/inventory/${medicineId}`),

  /**
   * Check medicine availability at a facility with deterministic alternatives
   */
  checkAvailability: (
    facilityId: string,
    medicineId: string,
  ): Promise<AvailabilityCheckResult> =>
    api.get<AvailabilityCheckResult>('/inventory/check', {
      params: { facilityId, medicineId },
    }),

  /**
   * Multi-item prescription availability check with deterministic alternatives
   */
  checkPrescriptionAvailability: (
    facilityId: string,
    items: PrescriptionCheckItem[],
  ): Promise<PrescriptionCheckResult> =>
    api.post<PrescriptionCheckResult>('/inventory/check-prescription', {
      facilityId,
      items,
    }),

  /**
   * Record stock intake/receipt for a facility
   */
  recordIntake: (
    dto: StockIntakeDto,
  ): Promise<{
    transaction: StockTransaction;
    updatedStock: MedicineStock;
  }> =>
    api.post('/inventory/intake', dto),

  /**
   * Concurrency-safe stock adjustment (ISSUE, RECEIPT, ADJUSTMENT, CORRECTION)
   */
  adjustStock: (
    dto: StockAdjustmentDto,
  ): Promise<{
    transaction: StockTransaction;
    updatedStock: MedicineStock;
  }> =>
    api.post('/inventory/adjust', dto),
};
