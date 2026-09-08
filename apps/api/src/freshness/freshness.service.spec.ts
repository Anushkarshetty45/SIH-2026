import { Test, TestingModule } from '@nestjs/testing';
import { FreshnessService } from './freshness.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundException } from '@nestjs/common';
import { BedCategory, BedStatus, EquipmentStatus } from '@prisma/client';
import { DomainEventType } from '../notifications/domain-events.interface';
import { StaleResourceFilterType } from './dto/freshness.dto';

describe('FreshnessService', () => {
  let service: FreshnessService;
  let prisma: any;
  let notificationsService: any;
  let auditService: any;

  const mockFacility = {
    id: 'fac-fresh-1',
    name: 'Shirpur Rural Hospital',
    district: 'Dhule',
    type: 'SUB_DISTRICT_HOSPITAL',
    contactPhone: '+919876543210',
    lastUpdatedAt: new Date(),
    admin: {
      id: 'usr-admin-1',
      name: 'Dr. Anand Shinde',
      phone: '+919876500000',
      email: 'anand.shinde@caregrid.in',
    },
    Beds: [],
    Equipment: [],
    MedicineStocks: [],
  };

  beforeEach(async () => {
    prisma = {
      facility: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      bed: { findMany: jest.fn() },
      equipment: { findMany: jest.fn() },
      medicineStock: { findMany: jest.fn() },
    };

    notificationsService = {
      emit: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue(undefined),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FreshnessService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'app.staleThresholds.bedsMinutes') return 120;
              if (key === 'app.staleThresholds.equipmentMinutes') return 120;
              if (key === 'app.staleThresholds.inventoryMinutes') return 120;
              return null;
            }),
          },
        },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<FreshnessService>(FreshnessService);
  });

  describe('getFacilityFreshness', () => {
    it('should return CURRENT when updated recently', async () => {
      const recentDate = new Date(Date.now() - 30 * 60 * 1000); // 30 mins ago
      prisma.facility.findUnique.mockResolvedValue({
        ...mockFacility,
        lastUpdatedAt: recentDate,
        Beds: [
          {
            id: 'b1',
            bedNumber: '101',
            category: BedCategory.GENERAL,
            status: BedStatus.AVAILABLE,
            lastUpdatedAt: recentDate,
          },
        ],
        Equipment: [
          {
            id: 'eq1',
            name: 'ECG',
            category: 'DIAGNOSTIC',
            totalQuantity: 2,
            availableQuantity: 2,
            status: EquipmentStatus.OPERATIONAL,
            lastUpdatedAt: recentDate,
          },
        ],
        MedicineStocks: [
          {
            id: 'ms1',
            currentStock: 100,
            lastUpdatedAt: recentDate,
            medicine: { id: 'm1', name: 'Paracetamol' },
          },
        ],
      });

      const res = await service.getFacilityFreshness('fac-fresh-1');

      expect(res.overallFreshness).toBe('CURRENT');
      expect(res.maxAgeMinutes).toBeLessThanOrEqual(31);
      expect(res.beds.isStale).toBe(false);
      expect(res.equipment.isStale).toBe(false);
      expect(res.inventory.isStale).toBe(false);
      expect(res.hasStaleLifeCriticalData).toBe(false);
      expect(res.criticalWarnings).toHaveLength(0);
    });

    it('should return STALE with warnings when ICU beds are stale (> 120m)', async () => {
      const threeHoursAgo = new Date(Date.now() - 180 * 60 * 1000); // 180 mins ago
      prisma.facility.findUnique.mockResolvedValue({
        ...mockFacility,
        lastUpdatedAt: threeHoursAgo,
        Beds: [
          {
            id: 'b-icu',
            bedNumber: 'ICU-1',
            category: BedCategory.ICU,
            status: BedStatus.AVAILABLE,
            lastUpdatedAt: threeHoursAgo,
          },
        ],
        Equipment: [],
        MedicineStocks: [],
      });

      const res = await service.getFacilityFreshness('fac-fresh-1');

      expect(res.overallFreshness).toBe('STALE');
      expect(res.maxAgeMinutes).toBeGreaterThanOrEqual(180);
      expect(res.beds.isStale).toBe(true);
      expect(res.beds.unreliableForEmergency).toBe(true);
      expect(res.hasStaleLifeCriticalData).toBe(true);
      expect(res.emergencyDispatchSafe).toBe(false);
      expect(res.criticalWarnings.length).toBeGreaterThan(0);
      expect(res.criticalWarnings[0]).toContain('STALE AVAILABILITY');
    });

    it('should return CRITICALLY_STALE when older than Tier 2 threshold (>= 240m)', async () => {
      const fiveHoursAgo = new Date(Date.now() - 300 * 60 * 1000);
      prisma.facility.findUnique.mockResolvedValue({
        ...mockFacility,
        lastUpdatedAt: fiveHoursAgo,
        Beds: [],
        Equipment: [],
        MedicineStocks: [],
      });

      const res = await service.getFacilityFreshness('fac-fresh-1');

      expect(res.overallFreshness).toBe('CRITICALLY_STALE');
      expect(res.maxAgeMinutes).toBeGreaterThanOrEqual(300);
    });

    it('should throw NotFoundException if facility does not exist', async () => {
      prisma.facility.findUnique.mockResolvedValue(null);

      await expect(service.getFacilityFreshness('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStaleEscalationBatches', () => {
    it('should group stale resources and assign TIER_1_FACILITY_ADMIN for 120-239m overdue', async () => {
      const twoPointFiveHoursAgo = new Date(Date.now() - 150 * 60 * 1000);
      prisma.facility.findMany.mockResolvedValue([
        {
          id: 'fac-1',
          name: 'Dhadgaon PHC',
          district: 'Nandurbar',
          contactPhone: '+919876543210',
          lastUpdatedAt: twoPointFiveHoursAgo,
          admin: mockFacility.admin,
          Beds: [
            {
              id: 'b1',
              bedNumber: 'B1',
              ward: 'General',
              category: BedCategory.GENERAL,
              status: BedStatus.AVAILABLE,
              lastUpdatedAt: twoPointFiveHoursAgo,
            },
          ],
          Equipment: [],
          MedicineStocks: [],
        },
      ]);

      const batches = await service.getStaleEscalationBatches(120);

      expect(batches).toHaveLength(1);
      expect(batches[0].facilityId).toBe('fac-1');
      expect(batches[0].tier).toBe('TIER_1_FACILITY_ADMIN');
      expect(batches[0].targetRole).toBe('FACILITY_ADMIN');
      expect(batches[0].maxStaleMinutes).toBeGreaterThanOrEqual(150);
      expect(batches[0].items).toHaveLength(1);
    });

    it('should assign TIER_2_DISTRICT_AUTHORITY for >= 240m overdue', async () => {
      const fiveHoursAgo = new Date(Date.now() - 300 * 60 * 1000);
      prisma.facility.findMany.mockResolvedValue([
        {
          id: 'fac-critical',
          name: 'Remote Sub-center',
          district: 'Gadchiroli',
          contactPhone: '+919876543210',
          lastUpdatedAt: fiveHoursAgo,
          admin: mockFacility.admin,
          Beds: [
            {
              id: 'b-icu',
              bedNumber: 'ICU-1',
              ward: 'ICU',
              category: BedCategory.ICU,
              status: BedStatus.AVAILABLE,
              lastUpdatedAt: fiveHoursAgo,
            },
          ],
          Equipment: [
            {
              id: 'eq-vent',
              name: 'Ventilator 500',
              category: 'LIFE_SUPPORT',
              totalQuantity: 1,
              availableQuantity: 1,
              status: EquipmentStatus.OPERATIONAL,
              lastUpdatedAt: fiveHoursAgo,
            },
          ],
          MedicineStocks: [
            {
              id: 'ms-1',
              currentStock: 20,
              lastUpdatedAt: fiveHoursAgo,
              medicine: { id: 'm1', name: 'Atropine' },
            },
          ],
        },
      ]);

      const batches = await service.getStaleEscalationBatches();

      expect(batches).toHaveLength(1);
      const batch = batches[0];
      expect(batch.tier).toBe('TIER_2_DISTRICT_AUTHORITY');
      expect(batch.targetRole).toBe('DISTRICT_ADMIN');
      expect(batch.hasLifeCriticalItems).toBe(true);
      expect(batch.resourceTypes).toEqual(
        expect.arrayContaining(['BEDS', 'EQUIPMENT', 'INVENTORY']),
      );
      expect(batch.items).toHaveLength(3);
    });
  });

  describe('getStaleRecords', () => {
    it('should filter stale records by resourceType', async () => {
      const staleTime = new Date(Date.now() - 150 * 60 * 1000);
      prisma.facility.findMany.mockResolvedValue([
        {
          id: 'fac-filter',
          name: 'Filter Clinic',
          district: 'Pune',
          contactPhone: null,
          lastUpdatedAt: staleTime,
          admin: null,
          Beds: [
            {
              id: 'b1',
              bedNumber: 'B1',
              ward: 'Ward A',
              category: BedCategory.GENERAL,
              status: BedStatus.AVAILABLE,
              lastUpdatedAt: staleTime,
            },
          ],
          Equipment: [
            {
              id: 'eq1',
              name: 'X-Ray',
              category: 'IMAGING',
              totalQuantity: 1,
              availableQuantity: 1,
              status: EquipmentStatus.OPERATIONAL,
              lastUpdatedAt: staleTime,
            },
          ],
          MedicineStocks: [],
        },
      ]);

      const res = await service.getStaleRecords({
        resourceType: StaleResourceFilterType.EQUIPMENT,
      });

      expect(res.records).toHaveLength(1);
      expect(res.records[0].resourceType).toBe('EQUIPMENT');
      expect(res.records[0].name).toBe('X-Ray');
    });
  });

  describe('emitStaleDomainEvents', () => {
    it('should emit ESCALATION_TRIGGERED and resource events via NotificationsService', async () => {
      const staleTime = new Date(Date.now() - 180 * 60 * 1000);
      prisma.facility.findMany.mockResolvedValue([
        {
          id: 'fac-event',
          name: 'Event PHC',
          district: 'Dhule',
          contactPhone: '+919999999999',
          lastUpdatedAt: staleTime,
          admin: mockFacility.admin,
          Beds: [
            {
              id: 'b1',
              bedNumber: '1',
              ward: 'W',
              category: BedCategory.GENERAL,
              status: BedStatus.AVAILABLE,
              lastUpdatedAt: staleTime,
            },
          ],
          Equipment: [],
          MedicineStocks: [],
        },
      ]);

      const result = await service.emitStaleDomainEvents('Dhule');

      expect(result.emittedCount).toBeGreaterThan(0);
      expect(notificationsService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: DomainEventType.ESCALATION_TRIGGERED,
          payload: expect.objectContaining({
            facilityId: 'fac-event',
            district: 'Dhule',
          }),
        }),
      );
      expect(notificationsService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: DomainEventType.BEDS_STALE,
          payload: expect.objectContaining({
            resourceType: 'BEDS',
          }),
        }),
      );
    });
  });
});
