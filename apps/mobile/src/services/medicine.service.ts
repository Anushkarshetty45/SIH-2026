// Medicine Catalog Service — integrates with D2 backend /medicines endpoints

import { api } from '../api/client';
import {
  Medicine,
  ControlledAlternative,
  PaginatedResult,
  PaginationQuery,
} from '../types';

export interface MedicineQuery extends PaginationQuery {
  search?: string;
  category?: string;
  isActive?: boolean;
}

export interface MedicineAlternativesResponse {
  primaryMedicine: Medicine;
  controlledAlternatives: ControlledAlternative[];
  genericEquivalents: ControlledAlternative[];
}

export const medicineService = {
  /**
   * Search medicines from master catalog
   */
  searchMedicines: (query?: MedicineQuery): Promise<PaginatedResult<Medicine>> =>
    api.get<PaginatedResult<Medicine>>('/medicines', { params: query }),

  /**
   * Get single medicine details
   */
  getMedicineById: (id: string): Promise<Medicine> =>
    api.get<Medicine>(`/medicines/${id}`),

  /**
   * Get deterministic controlled alternatives and generic equivalents (with optional facility availability check)
   */
  getAlternatives: (
    medicineId: string,
    facilityId?: string,
  ): Promise<MedicineAlternativesResponse> =>
    api.get<MedicineAlternativesResponse>(`/medicines/${medicineId}/alternatives`, {
      params: { facilityId },
    }),
};
