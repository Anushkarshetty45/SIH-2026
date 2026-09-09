// Unified Freshness Service — integrates with D2 backend /freshness endpoints

import { api } from '../api/client';
import { FreshnessStatus } from '../types';

export interface UnifiedFacilityFreshness {
  facilityId: string;
  facilityName: string;
  district: string;
  overallStatus: FreshnessStatus;
  isStale: boolean;
  bedsLastUpdated: string;
  bedsStale: boolean;
  equipmentLastUpdated: string;
  equipmentStale: boolean;
  inventoryLastUpdated: string;
  inventoryStale: boolean;
  escalationTier: 'NONE' | 'TIER_1_FACILITY' | 'TIER_2_DISTRICT';
}

export const freshnessService = {
  /**
   * Get unified freshness profile for a facility across beds, equipment, inventory
   */
  getFacilityFreshness: (facilityId: string): Promise<UnifiedFacilityFreshness> =>
    api.get<UnifiedFacilityFreshness>(`/freshness/facility/${facilityId}`),

  /**
   * Query stale records across beds, equipment, and inventory
   */
  getStaleRecords: (query?: {
    resourceType?: 'ALL' | 'BEDS' | 'EQUIPMENT' | 'INVENTORY';
    district?: string;
    thresholdMinutes?: number;
  }): Promise<Array<{
    facilityId: string;
    facilityName: string;
    resourceType: string;
    resourceId?: string;
    lastUpdatedAt: string;
    staleMinutes: number;
  }>> => api.get('/freshness/stale-records', { params: query }),
};
