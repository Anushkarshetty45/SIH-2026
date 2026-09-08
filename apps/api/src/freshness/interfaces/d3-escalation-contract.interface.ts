import { DomainEvent } from '../../notifications/domain-events.interface';

export type StaleResourceType = 'BEDS' | 'EQUIPMENT' | 'INVENTORY';

export type EscalationTier = 'TIER_1_FACILITY_ADMIN' | 'TIER_2_DISTRICT_AUTHORITY';

export interface StaleResourceItem {
  resourceType: StaleResourceType;
  id: string;
  name: string;
  category?: string;
  isLifeCritical: boolean;
  lastUpdatedAt: Date;
  ageMinutes: number;
  unreliableForEmergency?: boolean;
  criticalWarning?: string | null;
  metadata?: Record<string, any>;
}

export interface StaleEscalationBatch {
  facilityId: string;
  facilityName: string;
  district: string;
  contactPhone: string | null;
  adminContact?: {
    id: string;
    name: string;
    phone: string | null;
    email: string;
  } | null;
  tier: EscalationTier;
  targetRole: 'FACILITY_ADMIN' | 'DISTRICT_ADMIN';
  maxStaleMinutes: number;
  oldestUpdate: Date;
  resourceTypes: StaleResourceType[];
  hasLifeCriticalItems: boolean;
  staleBedsCount: number;
  staleEquipmentCount: number;
  staleInventoryCount: number;
  items: StaleResourceItem[];
}

export interface FacilityFreshnessSummary {
  facilityId: string;
  facilityName: string;
  district: string;
  overallFreshness: 'CURRENT' | 'STALE' | 'CRITICALLY_STALE';
  lastUpdatedAt: Date;
  maxAgeMinutes: number;
  hasStaleLifeCriticalData: boolean;
  emergencyDispatchSafe: boolean;
  criticalWarnings: string[];
  beds: {
    isStale: boolean;
    ageMinutes: number;
    totalBeds: number;
    availableBeds: number;
    icuAvailable: number;
    oxygenAvailable: number;
    ventilatorAvailable: number;
    unreliableForEmergency: boolean;
  };
  equipment: {
    isStale: boolean;
    ageMinutes: number;
    totalCount: number;
    operationalCount: number;
    hasStaleCriticalEquipment: boolean;
  };
  inventory: {
    isStale: boolean;
    ageMinutes: number;
    totalMedicinesTracked: number;
    staleMedicinesCount: number;
  };
}

/**
 * Developer 3 Escalation Service Contract
 * D3's BullMQ worker can directly inject or call this service to retrieve
 * domain-detected staleness and push to SMS / Ntfy / WebSockets.
 */
export interface ID3FreshnessEscalationService {
  /**
   * Evaluates all facilities and groups overdue resources into escalation batches.
   * Tier 1: > 120 minutes (Target: Facility Admin)
   * Tier 2: > 240 minutes (Target: District Authority / Dean)
   */
  getStaleEscalationBatches(
    thresholdMinutes?: number,
    district?: string,
  ): Promise<StaleEscalationBatch[]>;

  /**
   * Returns a complete freshness profile for a specific facility or all facilities.
   */
  getFacilityFreshness(facilityId: string): Promise<FacilityFreshnessSummary>;

  /**
   * Emits domain events via NotificationsService for any active WebSocket/D3 listeners.
   */
  emitStaleDomainEvents(district?: string): Promise<{
    emittedCount: number;
    events: DomainEvent[];
  }>;
}
