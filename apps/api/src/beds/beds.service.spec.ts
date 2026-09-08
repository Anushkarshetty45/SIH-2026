import { Test, TestingModule } from '@nestjs/testing';
import { BedsService } from './beds.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { BedCategory, BedStatus } from '@prisma/client';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('BedsService', () => {
  let service: BedsService;
  let prisma: any;
  let audit: any;

  const mockFacility = {
    id: 'fac-1',
    name: 'Shirpur Rural Hospital',
    lastUpdatedAt: new Date(),
  };

  const mockBed = {
    id: 'bed-1',
    facilityId: 'fac-1',
    bedNumber: 'ICU-01',
    ward: 'ICU Ward',
    category: BedCategory.ICU,
    status: BedStatus.AVAILABLE,
    lastUpdatedAt: new Date(),
    updatedById: 'user-staff-1',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      facility: {
        findUnique: jest.fn().mockResolvedValue(mockFacility),
        update: jest.fn().mockResolvedValue(mockFacility),
        findMany: jest.fn().mockResolvedValue([]),
      },
      bed: {
        findUnique: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    audit = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const config = {
      get: jest.fn((key: string) => {
        if (key === 'app.staleThresholds.bedsMinutes') return 120;
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BedsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<BedsService>(BedsService);
  });

  describe('create', () => {
    it('should register a new bed and update facility timestamp', async () => {
      prisma.bed.findUnique.mockResolvedValue(null);
      prisma.bed.create.mockResolvedValue(mockBed);

      const result = await service.create(
        {
          facilityId: 'fac-1',
          bedNumber: 'ICU-01',
          ward: 'ICU Ward',
          category: BedCategory.ICU,
        },
        'user-staff-1',
      );

      expect(result).toBeDefined();
      expect(result.bedNumber).toBe('ICU-01');
      expect(prisma.bed.create).toHaveBeenCalled();
      expect(prisma.facility.update).toHaveBeenCalledWith({
        where: { id: 'fac-1' },
        data: { lastUpdatedAt: expect.any(Date) },
      });
      expect(audit.log).toHaveBeenCalledWith(
        'BED_CREATED',
        'user-staff-1',
        'Bed',
        'bed-1',
        expect.any(Object),
      );
    });

    it('should reject duplicate bed numbers in same facility', async () => {
      prisma.bed.findUnique.mockResolvedValue(mockBed);

      await expect(
        service.create({
          facilityId: 'fac-1',
          bedNumber: 'ICU-01',
          ward: 'ICU Ward',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateStatus', () => {
    it('should update status and record server lastUpdatedAt', async () => {
      prisma.bed.findUnique.mockResolvedValue(mockBed);
      prisma.bed.update.mockResolvedValue({
        ...mockBed,
        status: BedStatus.OCCUPIED,
      });

      const result = await service.updateStatus(
        'bed-1',
        { status: BedStatus.OCCUPIED },
        'user-nurse-1',
      );

      expect(result.status).toBe(BedStatus.OCCUPIED);
      expect(prisma.bed.update).toHaveBeenCalledWith({
        where: { id: 'bed-1' },
        data: {
          status: BedStatus.OCCUPIED,
          lastUpdatedAt: expect.any(Date),
          updatedById: 'user-nurse-1',
        },
        include: expect.any(Object),
      });
      expect(audit.log).toHaveBeenCalledWith(
        'BED_STATUS_UPDATED',
        'user-nurse-1',
        'Bed',
        'bed-1',
        expect.any(Object),
      );
    });

    it('should throw NotFoundException if bed does not exist', async () => {
      prisma.bed.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('non-existent', { status: BedStatus.OCCUPIED }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFacilityBedSummary & freshness', () => {
    it('should return categorized bed counts with isStale false when recently updated', async () => {
      const recentDate = new Date();
      prisma.bed.findMany.mockResolvedValue([
        {
          id: 'b1',
          category: BedCategory.ICU,
          status: BedStatus.AVAILABLE,
          lastUpdatedAt: recentDate,
        },
        {
          id: 'b2',
          category: BedCategory.ICU,
          status: BedStatus.OCCUPIED,
          lastUpdatedAt: recentDate,
        },
        {
          id: 'b3',
          category: BedCategory.OXYGEN,
          status: BedStatus.AVAILABLE,
          lastUpdatedAt: recentDate,
        },
      ]);

      const summary = await service.getFacilityBedSummary('fac-1');

      expect(summary.totalBeds).toBe(3);
      expect(summary.availableBeds).toBe(2);
      expect(summary.occupiedBeds).toBe(1);
      expect(summary.breakdown[BedCategory.ICU].total).toBe(2);
      expect(summary.breakdown[BedCategory.ICU].available).toBe(1);
      expect(summary.breakdown[BedCategory.OXYGEN].available).toBe(1);
      expect(summary.isStale).toBe(false);
      expect(summary.ageMinutes).toBeLessThanOrEqual(1);
    });

    it('should mark availability as stale when older than threshold (120 minutes)', async () => {
      const threeHoursAgo = new Date(Date.now() - 180 * 60 * 1000);
      prisma.facility.findUnique.mockResolvedValue({
        ...mockFacility,
        lastUpdatedAt: threeHoursAgo,
      });
      prisma.bed.findMany.mockResolvedValue([
        {
          id: 'b1',
          category: BedCategory.GENERAL,
          status: BedStatus.AVAILABLE,
          lastUpdatedAt: threeHoursAgo,
        },
      ]);

      const summary = await service.getFacilityBedSummary('fac-1');

      expect(summary.isStale).toBe(true);
      expect(summary.ageMinutes).toBeGreaterThanOrEqual(180);
    });

    it('should flag life-critical ICU/Oxygen/Ventilator beds as unreliable for emergency when stale', async () => {
      const threeHoursAgo = new Date(Date.now() - 180 * 60 * 1000);
      prisma.facility.findUnique.mockResolvedValue({
        ...mockFacility,
        lastUpdatedAt: threeHoursAgo,
      });
      prisma.bed.findMany.mockResolvedValue([
        {
          id: 'b-icu',
          category: BedCategory.ICU,
          status: BedStatus.AVAILABLE,
          lastUpdatedAt: threeHoursAgo,
        },
      ]);

      const summary = await service.getFacilityBedSummary('fac-1');

      expect(summary.isStale).toBe(true);
      expect(summary.hasStaleLifeCriticalBeds).toBe(true);
      expect(summary.emergencyDispatchSafe).toBe(false);
      expect(summary.lifeCriticalSummary.unreliableForEmergency).toBe(true);
      expect(summary.lifeCriticalSummary.criticalWarning).toContain('STALE AVAILABILITY');
      expect(summary.breakdown[BedCategory.ICU].unreliableForEmergency).toBe(true);
    });
  });

  describe('getEmergencyBedAvailability', () => {
    it('should return emergency beds and flag unreliableForEmergency when stale', async () => {
      const threeHoursAgo = new Date(Date.now() - 180 * 60 * 1000);
      prisma.facility.findMany.mockResolvedValue([
        {
          id: 'fac-dhule',
          name: 'Dhule Civil Hospital',
          district: 'Dhule',
          type: 'DISTRICT_HOSPITAL',
          contactPhone: '+919876543210',
          lastUpdatedAt: threeHoursAgo,
          Beds: [
            {
              id: 'b-icu-1',
              bedNumber: 'ICU-1',
              ward: 'ICU Ward',
              category: BedCategory.ICU,
              status: BedStatus.AVAILABLE,
              lastUpdatedAt: threeHoursAgo,
            },
          ],
        },
      ]);

      const result = await service.getEmergencyBedAvailability('fac-dhule');

      expect(result.count).toBe(1);
      expect(result.facilities[0].isStale).toBe(true);
      expect(result.facilities[0].unreliableForEmergency).toBe(true);
      expect(result.facilities[0].emergencyDispatchSafe).toBe(false);
      expect(result.facilities[0].criticalWarning).toContain('STALE AVAILABILITY');
      expect(result.facilities[0].emergencyBeds.icuAvailable).toBe(1);
    });
  });

  describe('getStaleFacilities for D3 escalation', () => {
    it('should query facilities that have not updated bed availability within threshold', async () => {
      const staleFacility = {
        id: 'fac-stale',
        name: 'Remote PHC',
        district: 'Dhule',
        lastUpdatedAt: new Date(Date.now() - 150 * 60 * 1000),
        admin: { id: 'u1', name: 'Dr. Patil', phone: '+919999999999', email: 'patil@phc.in' },
      };
      prisma.facility.findMany.mockResolvedValue([staleFacility]);

      const result = await service.getStaleFacilities(120);

      expect(result).toHaveLength(1);
      expect(result[0].facilityId).toBe('fac-stale');
      expect(result[0].staleForMinutes).toBeGreaterThanOrEqual(150);
      expect(result[0].adminContact?.name).toBe('Dr. Patil');
    });
  });
});
