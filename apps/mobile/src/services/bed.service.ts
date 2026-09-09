// Bed API Service — integrates with D2 backend /beds and /facilities/:id/beds endpoints

import { api } from '../api/client';
import {
  Bed,
  BedCategory,
  BedStatus,
  FacilityBedSummary,
  PaginatedResult,
  PaginationQuery,
} from '../types';

export interface BedQuery extends PaginationQuery {
  facilityId?: string;
  ward?: string;
  category?: BedCategory;
  status?: BedStatus;
}

export interface UpdateBedStatusDto {
  status: BedStatus;
  notes?: string;
}

export interface EmergencyBedAvailability {
  facilityId: string;
  facilityName: string;
  district: string;
  icuTotal: number;
  icuAvailable: number;
  oxygenTotal: number;
  oxygenAvailable: number;
  ventilatorTotal: number;
  ventilatorAvailable: number;
  lastUpdatedAt: string;
  isStale: boolean;
  unreliableForEmergency: boolean;
  escalationWarning?: string;
}

export const bedService = {
  /**
   * Get facility bed summary by category with data freshness
   */
  getFacilityBedSummary: (facilityId: string): Promise<{
    facilityId: string;
    lastUpdatedAt: string;
    isStale: boolean;
    categories: FacilityBedSummary[];
  }> => api.get(`/facilities/${facilityId}/beds`),

  /**
   * List beds with optional filters
   */
  listBeds: (query?: BedQuery): Promise<PaginatedResult<Bed>> =>
    api.get<PaginatedResult<Bed>>('/beds', { params: query }),

  /**
   * Get single bed details
   */
  getBedById: (id: string): Promise<Bed> =>
    api.get<Bed>(`/beds/${id}`),

  /**
   * Update bed status (AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE, UNAVAILABLE)
   */
  updateBedStatus: (id: string, dto: UpdateBedStatusDto): Promise<Bed> =>
    api.patch<Bed>(`/beds/${id}`, dto),

  /**
   * Get emergency bed availability (ICU, Oxygen, Ventilator) with freshness flags
   */
  getEmergencyBedAvailability: (
    facilityId?: string,
    district?: string,
  ): Promise<EmergencyBedAvailability[]> =>
    api.get<EmergencyBedAvailability[]>('/beds/emergency-availability', {
      params: { facilityId, district },
    }),

  /**
   * Find facilities with stale bed data for escalation
   */
  getStaleFacilities: (thresholdMinutes?: number): Promise<Array<{
    facilityId: string;
    facilityName: string;
    lastUpdatedAt: string;
    staleMinutes: number;
  }>> => api.get('/beds/stale', { params: { thresholdMinutes } }),
};
