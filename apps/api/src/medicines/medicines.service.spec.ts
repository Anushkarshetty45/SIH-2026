import { Test, TestingModule } from '@nestjs/testing';
import { MedicinesService } from './medicines.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('MedicinesService', () => {
  let service: MedicinesService;

  const mockPrisma = {
    medicine: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    medicineAlternative: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedicinesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<MedicinesService>(MedicinesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a medicine with normalized uppercase dosageForm', async () => {
      const dto = {
        name: 'Amoxicillin 500mg',
        genericName: 'Amoxicillin',
        dosageForm: 'capsule',
        strength: '500mg',
        category: 'Antibiotic',
      };

      const created = { id: 'med-1', ...dto, dosageForm: 'CAPSULE', isActive: true };
      mockPrisma.medicine.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(result).toEqual(created);
      expect(mockPrisma.medicine.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Amoxicillin 500mg',
          genericName: 'Amoxicillin',
          dosageForm: 'CAPSULE',
          strength: '500mg',
        }),
      });
    });
  });

  describe('addAlternative', () => {
    it('should reject linking a medicine to itself', async () => {
      await expect(
        service.addAlternative('med-1', { alternativeMedicineId: 'med-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if primary medicine does not exist', async () => {
      mockPrisma.medicine.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.addAlternative('med-1', { alternativeMedicineId: 'med-2' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should successfully link two valid medicines', async () => {
      mockPrisma.medicine.findUnique
        .mockResolvedValueOnce({ id: 'med-1', name: 'Brand A' })
        .mockResolvedValueOnce({ id: 'med-2', name: 'Brand B' });

      mockPrisma.medicineAlternative.create.mockResolvedValue({
        id: 'alt-1',
        medicineId: 'med-1',
        alternativeMedicineId: 'med-2',
        alternativeMedicine: { id: 'med-2', name: 'Brand B' },
      });

      const result = await service.addAlternative('med-1', {
        alternativeMedicineId: 'med-2',
        notes: 'Bioequivalent',
      });

      expect(result.id).toBe('alt-1');
    });
  });

  describe('getAlternatives', () => {
    it('should return both controlled mappings and generic equivalents', async () => {
      const primary = {
        id: 'med-1',
        name: 'Brand A 500mg',
        genericName: 'Paracetamol',
        strength: '500mg',
        dosageForm: 'TABLET',
      };

      mockPrisma.medicine.findUnique.mockResolvedValue(primary);

      mockPrisma.medicineAlternative.findMany.mockResolvedValue([
        {
          id: 'alt-1',
          alternativeMedicineId: 'med-2',
          notes: 'Clinically approved brand equivalent',
          alternativeMedicine: {
            id: 'med-2',
            name: 'Brand B 500mg',
            genericName: 'Paracetamol',
            strength: '500mg',
            dosageForm: 'TABLET',
            manufacturer: 'Mfr B',
          },
        },
      ]);

      mockPrisma.medicine.findMany.mockResolvedValue([
        {
          id: 'med-3',
          name: 'Generic Paracetamol 500mg',
          genericName: 'Paracetamol',
          strength: '500mg',
          dosageForm: 'TABLET',
          manufacturer: 'Govt Depot',
        },
      ]);

      const result = await service.getAlternatives('med-1');

      expect(result.controlledAlternatives).toHaveLength(1);
      expect(result.controlledAlternatives[0].name).toBe('Brand B 500mg');
      expect(result.genericEquivalents).toHaveLength(1);
      expect(result.genericEquivalents[0].name).toBe('Generic Paracetamol 500mg');
      expect(result.clinicalNote).toContain('prescribing clinician');
    });

    it('should include live stock availability when facilityId is provided', async () => {
      const primary = {
        id: 'med-1',
        name: 'Brand A 500mg',
        genericName: 'Paracetamol',
        strength: '500mg',
        dosageForm: 'TABLET',
        Stocks: [{ currentStock: 0, reorderLevel: 10, lastUpdatedAt: new Date() }],
      };

      mockPrisma.medicine.findUnique.mockResolvedValue(primary);

      mockPrisma.medicineAlternative.findMany.mockResolvedValue([
        {
          id: 'alt-1',
          alternativeMedicineId: 'med-2',
          notes: 'Clinically approved brand equivalent',
          alternativeMedicine: {
            id: 'med-2',
            name: 'Brand B 500mg',
            genericName: 'Paracetamol',
            strength: '500mg',
            dosageForm: 'TABLET',
            unit: 'tablets',
            Stocks: [
              { currentStock: 80, reorderLevel: 10, unit: 'tablets', lastUpdatedAt: new Date() },
            ],
          },
        },
      ]);

      mockPrisma.medicine.findMany.mockResolvedValue([]);

      const result = await service.getAlternatives('med-1', 'fac-1');

      expect(result.medicine.currentStock).toBe(0);
      expect(result.controlledAlternatives[0].availability).toBeDefined();
      expect(result.controlledAlternatives[0].availability?.currentStock).toBe(80);
      expect(result.controlledAlternatives[0].availability?.status).toBe('AVAILABLE');
      expect(result.substitutionRule).toBe('DETERMINISTIC_CONTROLLED_ONLY');
    });
  });
});
