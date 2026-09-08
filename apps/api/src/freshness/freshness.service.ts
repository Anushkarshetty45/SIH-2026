import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  DomainEvent,
  DomainEventType,
  EscalationTriggeredEventPayload,
  StaleResourceEventPayload,
} from '../notifications/domain-events.interface';
import {
  FRESHNESS_THRESHOLDS,
  STALE_LIFE_CRITICAL_WARNING,
  isLifeCriticalBedCategory,
  isLifeCriticalEquipment,
} from '../common/constants/freshness.constants';
import {
  ID3FreshnessEscalationService,
  StaleEscalationBatch,
  FacilityFreshnessSummary,
  StaleResourceItem,
  StaleResourceType,
} from './interfaces/d3-escalation-contract.interface';
import { StaleRecordsQueryDto, StaleResourceFilterType } from './dto/freshness.dto';
import { BedCategory, BedStatus, EquipmentStatus } from '@prisma/client';

@Injectable()
export class FreshnessService implements ID3FreshnessEscalationService {
  private readonly logger = new Logger(FreshnessService.name);
  private readonly defaultBedsMinutes: number;
  private readonly defaultEquipmentMinutes: number;
  private readonly defaultInventoryMinutes: number;
  private readonly tier2EscalationMinutes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {
    this.defaultBedsMinutes =
      this.config.get<number>('app.staleThresholds.bedsMinutes') ??
      FRESHNESS_THRESHOLDS.BEDS_MINUTES;
    this.defaultEquipmentMinutes =
      this.config.get<number>('app.staleThresholds.equipmentMinutes') ??
      FRESHNESS_THRESHOLDS.EQUIPMENT_MINUTES;
    this.defaultInventoryMinutes =
      this.config.get<number>('app.staleThresholds.inventoryMinutes') ??
      FRESHNESS_THRESHOLDS.INVENTORY_MINUTES;
    this.tier2EscalationMinutes = FRESHNESS_THRESHOLDS.TIER_2_ESCALATION_MINUTES;
  }

  /**
   * Retrieves full freshness summary for a specific facility across all operational domains.
   */
  async getFacilityFreshness(facilityId: string): Promise<FacilityFreshnessSummary> {
    const facility = await this.prisma.facility.findUnique({
      where: { id: facilityId },
      include: {
        Beds: {
          select: {
            id: true,
            bedNumber: true,
            category: true,
            status: true,
            lastUpdatedAt: true,
          },
        },
        Equipment: {
          select: {
            id: true,
            name: true,
            category: true,
            totalQuantity: true,
            availableQuantity: true,
            status: true,
            lastUpdatedAt: true,
          },
        },
        MedicineStocks: {
          select: {
            id: true,
            currentStock: true,
            lastUpdatedAt: true,
            medicine: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!facility) {
      throw new NotFoundException(`Facility ${facilityId} not found`);
    }

    const now = Date.now();

    // 1. Bed Freshness & Capacity
    let latestBedUpdate = facility.lastUpdatedAt;
    let totalBeds = 0;
    let availableBeds = 0;
    let icuAvailable = 0;
    let oxygenAvailable = 0;
    let ventilatorAvailable = 0;

    for (const b of facility.Beds) {
      totalBeds++;
      if (b.status === BedStatus.AVAILABLE) {
        availableBeds++;
        if (b.category === BedCategory.ICU) icuAvailable++;
        if (b.category === BedCategory.OXYGEN) oxygenAvailable++;
        if (b.category === BedCategory.VENTILATOR) ventilatorAvailable++;
      }
      if (b.lastUpdatedAt > latestBedUpdate) {
        latestBedUpdate = b.lastUpdatedAt;
      }
    }

    const bedAgeMinutes = Math.max(0, Math.floor((now - latestBedUpdate.getTime()) / (60 * 1000)));
    const bedsStale = bedAgeMinutes > this.defaultBedsMinutes;

    // 2. Equipment Freshness
    let latestEquipmentUpdate = facility.lastUpdatedAt;
    let totalEquipmentCount = 0;
    let operationalCount = 0;
    let hasStaleCriticalEquipment = false;

    for (const eq of facility.Equipment) {
      totalEquipmentCount += eq.totalQuantity;
      if (eq.status === EquipmentStatus.OPERATIONAL) {
        operationalCount += eq.availableQuantity;
      }
      if (eq.lastUpdatedAt > latestEquipmentUpdate) {
        latestEquipmentUpdate = eq.lastUpdatedAt;
      }
    }

    const equipmentAgeMinutes = Math.max(
      0,
      Math.floor((now - latestEquipmentUpdate.getTime()) / (60 * 1000)),
    );
    const equipmentStale = equipmentAgeMinutes > this.defaultEquipmentMinutes;

    if (equipmentStale) {
      for (const eq of facility.Equipment) {
        if (isLifeCriticalEquipment(eq.name, eq.category) && eq.availableQuantity > 0) {
          hasStaleCriticalEquipment = true;
          break;
        }
      }
    }

    // 3. Inventory Freshness
    let latestInventoryUpdate = facility.lastUpdatedAt;
    let staleMedicinesCount = 0;

    for (const stock of facility.MedicineStocks) {
      if (stock.lastUpdatedAt > latestInventoryUpdate) {
        latestInventoryUpdate = stock.lastUpdatedAt;
      }
      const age = Math.max(0, Math.floor((now - stock.lastUpdatedAt.getTime()) / (60 * 1000)));
      if (age > this.defaultInventoryMinutes) {
        staleMedicinesCount++;
      }
    }

    const inventoryAgeMinutes = Math.max(
      0,
      Math.floor((now - latestInventoryUpdate.getTime()) / (60 * 1000)),
    );
    const inventoryStale = inventoryAgeMinutes > this.defaultInventoryMinutes;

    // 4. Overall Freshness Calculation
    const maxAgeMinutes = Math.max(bedAgeMinutes, equipmentAgeMinutes, inventoryAgeMinutes);
    const oldestTimestamp = new Date(
      Math.min(
        latestBedUpdate.getTime(),
        latestEquipmentUpdate.getTime(),
        latestInventoryUpdate.getTime(),
      ),
    );

    let overallFreshness: 'CURRENT' | 'STALE' | 'CRITICALLY_STALE' = 'CURRENT';
    if (maxAgeMinutes >= this.tier2EscalationMinutes) {
      overallFreshness = 'CRITICALLY_STALE';
    } else if (bedsStale || equipmentStale || inventoryStale) {
      overallFreshness = 'STALE';
    }

    const hasStaleLifeCriticalBeds =
      bedsStale && (icuAvailable > 0 || oxygenAvailable > 0 || ventilatorAvailable > 0);
    const hasStaleLifeCriticalData = hasStaleLifeCriticalBeds || hasStaleCriticalEquipment;

    const criticalWarnings: string[] = [];
    if (hasStaleLifeCriticalBeds) {
      criticalWarnings.push(
        `ICU/Oxygen/Ventilator beds (${icuAvailable + oxygenAvailable + ventilatorAvailable} reported) are stale by ${bedAgeMinutes}m. ${STALE_LIFE_CRITICAL_WARNING}`,
      );
    }
    if (hasStaleCriticalEquipment) {
      criticalWarnings.push(
        `Life-critical equipment is stale by ${equipmentAgeMinutes}m. Verify operational status before referral/dispatch.`,
      );
    }

    const emergencyDispatchSafe =
      !hasStaleLifeCriticalData &&
      (icuAvailable > 0 || oxygenAvailable > 0 || ventilatorAvailable > 0);

    return {
      facilityId: facility.id,
      facilityName: facility.name,
      district: facility.district,
      overallFreshness,
      lastUpdatedAt: oldestTimestamp,
      maxAgeMinutes,
      hasStaleLifeCriticalData,
      emergencyDispatchSafe,
      criticalWarnings,
      beds: {
        isStale: bedsStale,
        ageMinutes: bedAgeMinutes,
        totalBeds,
        availableBeds,
        icuAvailable,
        oxygenAvailable,
        ventilatorAvailable,
        unreliableForEmergency: bedsStale,
      },
      equipment: {
        isStale: equipmentStale,
        ageMinutes: equipmentAgeMinutes,
        totalCount: totalEquipmentCount,
        operationalCount,
        hasStaleCriticalEquipment,
      },
      inventory: {
        isStale: inventoryStale,
        ageMinutes: inventoryAgeMinutes,
        totalMedicinesTracked: facility.MedicineStocks.length,
        staleMedicinesCount,
      },
    };
  }

  /**
   * Main D3 Escalation Endpoint:
   * Identifies all facilities with stale operational data and groups them into
   * structured escalation batches with priority tiers (Tier 1 = Admin, Tier 2 = District).
   */
  async getStaleEscalationBatches(
    thresholdMinutes?: number,
    district?: string,
  ): Promise<StaleEscalationBatch[]> {
    const minutes = thresholdMinutes ?? this.defaultBedsMinutes;
    const thresholdDate = new Date(Date.now() - minutes * 60 * 1000);

    const facilities = await this.prisma.facility.findMany({
      where: {
        ...(district && { district: { equals: district, mode: 'insensitive' } }),
        OR: [
          {
            Beds: {
              some: { lastUpdatedAt: { lt: thresholdDate } },
            },
          },
          {
            Equipment: {
              some: { lastUpdatedAt: { lt: thresholdDate } },
            },
          },
          {
            MedicineStocks: {
              some: { lastUpdatedAt: { lt: thresholdDate } },
            },
          },
          {
            lastUpdatedAt: { lt: thresholdDate },
          },
        ],
      },
      include: {
        admin: {
          select: { id: true, name: true, phone: true, email: true },
        },
        Beds: {
          where: { lastUpdatedAt: { lt: thresholdDate } },
          select: {
            id: true,
            bedNumber: true,
            ward: true,
            category: true,
            status: true,
            lastUpdatedAt: true,
          },
        },
        Equipment: {
          where: { lastUpdatedAt: { lt: thresholdDate } },
          select: {
            id: true,
            name: true,
            category: true,
            totalQuantity: true,
            availableQuantity: true,
            status: true,
            lastUpdatedAt: true,
          },
        },
        MedicineStocks: {
          where: { lastUpdatedAt: { lt: thresholdDate } },
          select: {
            id: true,
            currentStock: true,
            lastUpdatedAt: true,
            medicine: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { lastUpdatedAt: 'asc' },
    });

    const now = Date.now();
    const batches: StaleEscalationBatch[] = [];

    for (const fac of facilities) {
      const items: StaleResourceItem[] = [];
      const resourceTypesSet = new Set<StaleResourceType>();
      let hasLifeCritical = false;
      let oldestUpdate = fac.lastUpdatedAt;

      // Stale Beds
      for (const b of fac.Beds) {
        resourceTypesSet.add('BEDS');
        const isCritical = isLifeCriticalBedCategory(b.category);
        if (isCritical) hasLifeCritical = true;
        if (b.lastUpdatedAt < oldestUpdate) oldestUpdate = b.lastUpdatedAt;

        const ageMinutes = Math.floor((now - b.lastUpdatedAt.getTime()) / (60 * 1000));
        items.push({
          resourceType: 'BEDS',
          id: b.id,
          name: `Bed ${b.bedNumber} (${b.ward})`,
          category: b.category,
          isLifeCritical: isCritical,
          lastUpdatedAt: b.lastUpdatedAt,
          ageMinutes,
          unreliableForEmergency: isCritical,
          criticalWarning: isCritical ? STALE_LIFE_CRITICAL_WARNING : null,
          metadata: { status: b.status, ward: b.ward },
        });
      }

      // Stale Equipment
      for (const eq of fac.Equipment) {
        resourceTypesSet.add('EQUIPMENT');
        const isCritical = isLifeCriticalEquipment(eq.name, eq.category);
        if (isCritical) hasLifeCritical = true;
        if (eq.lastUpdatedAt < oldestUpdate) oldestUpdate = eq.lastUpdatedAt;

        const ageMinutes = Math.floor((now - eq.lastUpdatedAt.getTime()) / (60 * 1000));
        items.push({
          resourceType: 'EQUIPMENT',
          id: eq.id,
          name: eq.name,
          category: eq.category,
          isLifeCritical: isCritical,
          lastUpdatedAt: eq.lastUpdatedAt,
          ageMinutes,
          unreliableForEmergency: isCritical,
          criticalWarning: isCritical ? STALE_LIFE_CRITICAL_WARNING : null,
          metadata: {
            status: eq.status,
            availableQuantity: eq.availableQuantity,
            totalQuantity: eq.totalQuantity,
          },
        });
      }

      // Stale Inventory
      for (const stock of fac.MedicineStocks) {
        resourceTypesSet.add('INVENTORY');
        if (stock.lastUpdatedAt < oldestUpdate) oldestUpdate = stock.lastUpdatedAt;

        const ageMinutes = Math.floor((now - stock.lastUpdatedAt.getTime()) / (60 * 1000));
        items.push({
          resourceType: 'INVENTORY',
          id: stock.id,
          name: stock.medicine.name,
          isLifeCritical: false,
          lastUpdatedAt: stock.lastUpdatedAt,
          ageMinutes,
          metadata: { currentStock: stock.currentStock },
        });
      }

      // If facility itself has not been updated even if no child rows triggered
      if (items.length === 0 && fac.lastUpdatedAt < thresholdDate) {
        resourceTypesSet.add('BEDS');
        const ageMinutes = Math.floor((now - fac.lastUpdatedAt.getTime()) / (60 * 1000));
        items.push({
          resourceType: 'BEDS',
          id: fac.id,
          name: `${fac.name} Facility Availability`,
          isLifeCritical: false,
          lastUpdatedAt: fac.lastUpdatedAt,
          ageMinutes,
        });
      }

      const maxStaleMinutes = Math.floor((now - oldestUpdate.getTime()) / (60 * 1000));

      // Tier Calculation:
      // If overdue >= 240 mins (Tier 2), escalate to District Authority / Dean
      // Otherwise, Tier 1 to Facility Admin
      const isTier2 = maxStaleMinutes >= this.tier2EscalationMinutes;
      const tier = isTier2 ? 'TIER_2_DISTRICT_AUTHORITY' : 'TIER_1_FACILITY_ADMIN';
      const targetRole = isTier2 ? 'DISTRICT_ADMIN' : 'FACILITY_ADMIN';

      batches.push({
        facilityId: fac.id,
        facilityName: fac.name,
        district: fac.district,
        contactPhone: fac.contactPhone,
        adminContact: fac.admin,
        tier,
        targetRole,
        maxStaleMinutes,
        oldestUpdate,
        resourceTypes: Array.from(resourceTypesSet),
        hasLifeCriticalItems: hasLifeCritical,
        staleBedsCount: fac.Beds.length,
        staleEquipmentCount: fac.Equipment.length,
        staleInventoryCount: fac.MedicineStocks.length,
        items,
      });
    }

    return batches;
  }

  /**
   * Filtered query for stale records across beds, equipment, and inventory.
   */
  async getStaleRecords(query: StaleRecordsQueryDto) {
    const batches = await this.getStaleEscalationBatches(query.thresholdMinutes, query.district);

    let allItems = batches.flatMap((b) =>
      b.items.map((it) => ({
        ...it,
        facilityId: b.facilityId,
        facilityName: b.facilityName,
        district: b.district,
        tier: b.tier,
      })),
    );

    if (query.facilityId) {
      allItems = allItems.filter((it) => it.facilityId === query.facilityId);
    }

    if (query.resourceType && query.resourceType !== StaleResourceFilterType.ALL) {
      allItems = allItems.filter((it) => it.resourceType === query.resourceType);
    }

    return {
      totalStaleRecords: allItems.length,
      affectedFacilitiesCount: new Set(allItems.map((i) => i.facilityId)).size,
      thresholdMinutes: query.thresholdMinutes ?? this.defaultBedsMinutes,
      records: allItems,
    };
  }

  /**
   * Emits Domain Events via NotificationsService for D3 integration.
   * D3's BullMQ worker or event listener receives these and sends SMS / Ntfy.
   */
  async emitStaleDomainEvents(district?: string): Promise<{
    emittedCount: number;
    events: DomainEvent[];
  }> {
    const batches = await this.getStaleEscalationBatches(undefined, district);
    const events: DomainEvent[] = [];

    for (const batch of batches) {
      const payload: EscalationTriggeredEventPayload = {
        escalationId: `esc-${batch.facilityId}-${Date.now()}`,
        facilityId: batch.facilityId,
        facilityName: batch.facilityName,
        district: batch.district,
        tier: batch.tier,
        resourceTypes: batch.resourceTypes,
        maxStaleMinutes: batch.maxStaleMinutes,
        contactPhone: batch.contactPhone,
        adminContact: batch.adminContact,
      };

      const event: DomainEvent<EscalationTriggeredEventPayload> = {
        type: DomainEventType.ESCALATION_TRIGGERED,
        payload,
        occurredAt: new Date(),
        actorId: null,
      };

      await this.notificationsService.emit(event);
      events.push(event);

      // Also emit resource-specific events
      for (const resType of batch.resourceTypes) {
        let type: DomainEventType = DomainEventType.AVAILABILITY_STALE;
        if (resType === 'BEDS') type = DomainEventType.BEDS_STALE;
        if (resType === 'EQUIPMENT') type = DomainEventType.EQUIPMENT_STALE;
        if (resType === 'INVENTORY') type = DomainEventType.INVENTORY_STALE;

        const resPayload: StaleResourceEventPayload = {
          resourceType: resType,
          facilityId: batch.facilityId,
          facilityName: batch.facilityName,
          district: batch.district,
          staleForMinutes: batch.maxStaleMinutes,
          thresholdMinutes: this.defaultBedsMinutes,
          contactPhone: batch.contactPhone,
          hasLifeCriticalItems: batch.hasLifeCriticalItems,
          itemCount: batch.items.filter((i) => i.resourceType === resType).length,
        };

        const resEvent: DomainEvent<StaleResourceEventPayload> = {
          type,
          payload: resPayload,
          occurredAt: new Date(),
          actorId: null,
        };

        await this.notificationsService.emit(resEvent);
        events.push(resEvent);
      }
    }

    await this.auditService.log(
      'STALE_ESCALATION_EVENTS_TRIGGERED',
      null,
      'Freshness',
      district ?? 'ALL_DISTRICTS',
      { emittedEventsCount: events.length, batchesCount: batches.length },
    );

    this.logger.log(`Emitted ${events.length} domain events for D3 staleness escalation.`);
    return { emittedCount: events.length, events };
  }
}
