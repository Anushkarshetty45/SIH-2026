import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentService } from './equipment.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { EquipmentStatus } from '@prisma/client';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('EquipmentService', () => {
  let service: EquipmentService;
  let prisma: any;
  let audit: any;

  const mockFacility = {
    id: 'fac-1',
    name: 'Shirpur Rural Hospital',
    lastUpdatedAt: new Date(),
  };

  const mockEquipment = {
    id: 'eq-1',
    facilityId: 'fac-1',
    name: 'Oxygen Concentrator 10L',
    category: 'Respiratory',
    totalQuantity: 5,
    availableQuantity: 4,
    status: EquipmentStatus.OPERATIONAL,
    lastUpdatedAt: new Date(),
    updatedById: 'user-tech-1',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      facility: {
        findUnique: jest.fn().mockResolvedValue(mockFacility),
        update: jest.fn().mockResolvedValue(mockFacility),
        findMany: jest.fn().mockResolvedValue([]),
      },
      equipment: {
        findUnique: jest.fn(),
        create: jest.fn(),
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
        if (key === 'app.staleThresholds.equipmentMinutes') return 120;
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<EquipmentService>(EquipmentService);
  });

  describe('create', () => {
    it('should register medical equipment and update facility lastUpdatedAt', async () => {
      prisma.equipment.findUnique.mockResolvedValue(null);
      prisma.equipment.create.mockResolvedValue(mockEquipment);

      const result = await service.create(
        {
          facilityId: 'fac-1',
          name: 'Oxygen Concentrator 10L',
          category: 'Respiratory',
          totalQuantity: 5,
          availableQuantity: 4,
        },
        'user-tech-1',
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('Oxygen Concentrator 10L');
      expect(prisma.equipment.create).toHaveBeenCalled();
      expect(prisma.facility.update).toHaveBeenCalledWith({
        where: { id: 'fac-1' },
        data: { lastUpdatedAt: expect.any(Date) },
      });
      expect(audit.log).toHaveBeenCalledWith(
        'EQUIPMENT_CREATED',
        'user-tech-1',
        'Equipment',
        'eq-1',
        expect.any(Object),
      );
    });

    it('should reject when availableQuantity exceeds totalQuantity', async () => {
      await expect(
        service.create({
          facilityId: 'fac-1',
          name: 'Ventilator',
          category: 'ICU',
          totalQuantity: 2,
          availableQuantity: 3, // Invalid
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate equipment name in same facility', async () => {
      prisma.equipment.findUnique.mockResolvedValue(mockEquipment);

      await expect(
        service.create({
          facilityId: 'fac-1',
          name: 'Oxygen Concentrator 10L',
          category: 'Respiratory',
          totalQuantity: 5,
          availableQuantity: 4,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update quantities and record server lastUpdatedAt', async () => {
      prisma.equipment.findUnique.mockResolvedValue(mockEquipment);
      prisma.equipment.update.mockResolvedValue({
        ...mockEquipment,
        availableQuantity: 3,
      });

      const result = await service.update('eq-1', { availableQuantity: 3 }, 'user-nurse-1');

      expect(result.availableQuantity).toBe(3);
      expect(prisma.equipment.update).toHaveBeenCalledWith({
        where: { id: 'eq-1' },
        data: {
          availableQuantity: 3,
          lastUpdatedAt: expect.any(Date),
          updatedById: 'user-nurse-1',
        },
        include: expect.any(Object),
      });
      expect(audit.log).toHaveBeenCalledWith(
        'EQUIPMENT_UPDATED',
        'user-nurse-1',
        'Equipment',
        'eq-1',
        expect.any(Object),
      );
    });

    it('should reject update if new availableQuantity exceeds totalQuantity', async () => {
      prisma.equipment.findUnique.mockResolvedValue(mockEquipment); // total is 5

      await expect(service.update('eq-1', { availableQuantity: 6 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if equipment does not exist', async () => {
      prisma.equipment.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', { totalQuantity: 10 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getFacilityEquipment & freshness', () => {
    it('should return equipment list and operational counts with isStale status', async () => {
      const recentDate = new Date();
      prisma.equipment.findMany.mockResolvedValue([
        {
          ...mockEquipment,
          totalQuantity: 5,
          availableQuantity: 4,
          status: EquipmentStatus.OPERATIONAL,
          lastUpdatedAt: recentDate,
        },
        {
          ...mockEquipment,
          id: 'eq-2',
          name: 'ECG Machine',
          totalQuantity: 2,
          availableQuantity: 1,
          status: EquipmentStatus.OPERATIONAL,
          lastUpdatedAt: recentDate,
        },
      ]);

      const res = await service.getFacilityEquipment('fac-1');

      expect(res.totalEquipmentCount).toBe(7);
      expect(res.operationalCount).toBe(5);
      expect(res.isStale).toBe(false);
      expect(res.equipment).toHaveLength(2);
    });

    it('should mark equipment availability as stale when past threshold', async () => {
      const pastDate = new Date(Date.now() - 140 * 60 * 1000);
      prisma.facility.findUnique.mockResolvedValue({
        ...mockFacility,
        lastUpdatedAt: pastDate,
      });
      prisma.equipment.findMany.mockResolvedValue([{ ...mockEquipment, lastUpdatedAt: pastDate }]);

      const res = await service.getFacilityEquipment('fac-1');

      expect(res.isStale).toBe(true);
      expect(res.ageMinutes).toBeGreaterThanOrEqual(140);
    });

    it('should flag life-critical equipment (Ventilator) as unreliableForEmergency when stale', async () => {
      const pastDate = new Date(Date.now() - 140 * 60 * 1000);
      prisma.facility.findUnique.mockResolvedValue({
        ...mockFacility,
        lastUpdatedAt: pastDate,
      });
      prisma.equipment.findMany.mockResolvedValue([
        {
          id: 'eq-vent',
          facilityId: 'fac-1',
          name: 'ICU Ventilator',
          category: 'LIFE_SUPPORT',
          totalQuantity: 2,
          availableQuantity: 2,
          status: EquipmentStatus.OPERATIONAL,
          lastUpdatedAt: pastDate,
        },
      ]);

      const res = await service.getFacilityEquipment('fac-1');

      expect(res.isStale).toBe(true);
      expect(res.hasStaleLifeCriticalEquipment).toBe(true);
      expect(res.equipment[0].isLifeCritical).toBe(true);
      expect(res.equipment[0].unreliableForEmergency).toBe(true);
      expect(res.equipment[0].criticalWarning).toContain('STALE AVAILABILITY');
    });
  });

  describe('getStaleEquipment for D3 escalation', () => {
    it('should return facilities where equipment has not been updated within threshold', async () => {
      const staleFacility = {
        id: 'fac-eq-stale',
        name: 'Remote CHC',
        district: 'Nandurbar',
        lastUpdatedAt: new Date(Date.now() - 200 * 60 * 1000),
        admin: { id: 'u2', name: 'Dr. Deshmukh', phone: '+918888888888', email: 'deshmukh@chc.in' },
      };
      prisma.facility.findMany.mockResolvedValue([staleFacility]);

      const result = await service.getStaleEquipment(120);

      expect(result).toHaveLength(1);
      expect(result[0].facilityId).toBe('fac-eq-stale');
      expect(result[0].staleForMinutes).toBeGreaterThanOrEqual(200);
    });
  });
});
