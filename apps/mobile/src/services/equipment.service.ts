// Equipment API Service — integrates with D2 backend /equipment and /facilities/:id/equipment endpoints

import { api } from '../api/client';
import {
  Equipment,
  EquipmentStatus,
  PaginatedResult,
  PaginationQuery,
} from '../types';

export interface EquipmentQuery extends PaginationQuery {
  facilityId?: string;
  category?: string;
  status?: EquipmentStatus;
}

export interface UpdateEquipmentDto {
  availableQuantity?: number;
  totalQuantity?: number;
  status?: EquipmentStatus;
  operationalNotes?: string;
}

export const equipmentService = {
  /**
   * Get all equipment for a facility including freshness status
   */
  getFacilityEquipment: (facilityId: string): Promise<{
    facilityId: string;
    lastUpdatedAt: string;
    isStale: boolean;
    equipment: Equipment[];
  }> => api.get(`/facilities/${facilityId}/equipment`),

  /**
   * List equipment with optional filters
   */
  listEquipment: (query?: EquipmentQuery): Promise<PaginatedResult<Equipment>> =>
    api.get<PaginatedResult<Equipment>>('/equipment', { params: query }),

  /**
   * Get equipment details by ID
   */
  getEquipmentById: (id: string): Promise<Equipment> =>
    api.get<Equipment>(`/equipment/${id}`),

  /**
   * Update equipment quantities or operational status
   */
  updateEquipment: (id: string, dto: UpdateEquipmentDto): Promise<Equipment> =>
    api.patch<Equipment>(`/equipment/${id}`, dto),

  /**
   * Find facilities with stale equipment data
   */
  getStaleEquipment: (thresholdMinutes?: number): Promise<Array<{
    facilityId: string;
    facilityName: string;
    lastUpdatedAt: string;
    staleMinutes: number;
  }>> => api.get('/equipment/stale', { params: { thresholdMinutes } }),
};
