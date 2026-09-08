import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StockTransactionType } from '@prisma/client';
import { StockStatus } from './dto/inventory.dto';

describe('InventoryService', () => {
  let service: InventoryService;

  const mockPrisma = {
    facility: {
      findUnique: jest.fn(),
    },
    medicine: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
    },
    medicineStock: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    stockTransaction: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    medicineAlternative: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    inventoryImportBatch: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((_key: string, defaultValue: any) => defaultValue),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    jest.clearAllMocks();

    mockPrisma.medicine.findMany.mockResolvedValue([]);
    mockPrisma.medicineAlternative.findMany.mockResolvedValue([]);
    mockPrisma.medicineStock.findMany.mockResolvedValue([]);
    // Default $transaction mock executes callback with mockPrisma
    mockPrisma.$transaction.mockImplementation((cb: any) => cb(mockPrisma));
  });

  describe('recordIntake', () => {
    it('should throw NotFoundException if facility does not exist', async () => {
      mockPrisma.facility.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.recordIntake({
          facilityId: 'fac-invalid',
          medicineId: 'med-1',
          quantity: 50,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if medicine does not exist', async () => {
      mockPrisma.facility.findUnique.mockResolvedValueOnce({ id: 'fac-1' });
      mockPrisma.medicine.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.recordIntake({
          facilityId: 'fac-1',
          medicineId: 'med-invalid',
          quantity: 50,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should upsert stock and create transaction record', async () => {
      mockPrisma.facility.findUnique.mockResolvedValueOnce({ id: 'fac-1', name: 'PHC Pune' });
      mockPrisma.medicine.findUnique.mockResolvedValueOnce({
        id: 'med-1',
        name: 'Paracetamol 500mg',
        unit: 'tablets',
      });

      const updatedStock = {
        id: 'stock-1',
        facilityId: 'fac-1',
        medicineId: 'med-1',
        currentStock: 150,
        unit: 'tablets',
        lastUpdatedAt: new Date(),
      };

      mockPrisma.medicineStock.upsert.mockResolvedValueOnce(updatedStock);
      mockPrisma.stockTransaction.create.mockResolvedValueOnce({
        id: 'tx-1',
        type: StockTransactionType.RECEIPT,
        quantity: 50,
        balanceAfter: 150,
      });

      const result = await service.recordIntake(
        {
          facilityId: 'fac-1',
          medicineId: 'med-1',
          quantity: 50,
          supplier: 'Medical Supplies Depot',
        },
        'user-1',
      );

      expect(result.stock?.currentStock).toBe(150);
      expect(mockPrisma.stockTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            facilityId: 'fac-1',
            medicineId: 'med-1',
            type: StockTransactionType.RECEIPT,
            quantity: 50,
            balanceAfter: 150,
            createdById: 'user-1',
          }),
        }),
      );
    });
  });

  describe('adjustStock (concurrency & negative-stock safety)', () => {
    it('should successfully decrement stock on ISSUE', async () => {
      mockPrisma.medicineStock.findUnique.mockResolvedValueOnce({
        id: 'stock-1',
        facilityId: 'fac-1',
        medicineId: 'med-1',
        currentStock: 100,
        medicine: { name: 'Paracetamol 500mg' },
      });

      mockPrisma.medicineStock.update.mockResolvedValueOnce({
        id: 'stock-1',
        currentStock: 80,
      });

      mockPrisma.stockTransaction.create.mockResolvedValueOnce({
        id: 'tx-2',
        quantity: -20,
        balanceAfter: 80,
      });

      const result = await service.adjustStock(
        {
          facilityId: 'fac-1',
          medicineId: 'med-1',
          type: StockTransactionType.ISSUE,
          quantity: 20,
        },
        'nurse-1',
      );

      expect(result.stock.currentStock).toBe(80);
      expect(mockPrisma.medicineStock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currentStock: { decrement: 20 },
          }),
        }),
      );
    });

    it('should prevent negative stock and reject ISSUE if requested > currentStock', async () => {
      mockPrisma.medicineStock.findUnique.mockResolvedValueOnce({
        id: 'stock-1',
        facilityId: 'fac-1',
        medicineId: 'med-1',
        currentStock: 10,
        medicine: { name: 'Paracetamol 500mg' },
      });

      await expect(
        service.adjustStock({
          facilityId: 'fac-1',
          medicineId: 'med-1',
          type: StockTransactionType.ISSUE,
          quantity: 25,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.medicineStock.update).not.toHaveBeenCalled();
    });

    it('should support physical count ADJUSTMENT', async () => {
      mockPrisma.medicineStock.findUnique.mockResolvedValueOnce({
        id: 'stock-1',
        facilityId: 'fac-1',
        medicineId: 'med-1',
        currentStock: 45,
        medicine: { name: 'Paracetamol 500mg' },
      });

      mockPrisma.medicineStock.update.mockResolvedValueOnce({
        id: 'stock-1',
        currentStock: 50,
      });

      mockPrisma.stockTransaction.create.mockResolvedValueOnce({
        id: 'tx-3',
        quantity: 5,
        balanceAfter: 50,
      });

      const result = await service.adjustStock({
        facilityId: 'fac-1',
        medicineId: 'med-1',
        type: StockTransactionType.ADJUSTMENT,
        quantity: 50,
        notes: 'Monthly physical audit count',
      });

      expect(result.stock.currentStock).toBe(50);
      expect(mockPrisma.stockTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: StockTransactionType.ADJUSTMENT,
            quantity: 5, // delta: 50 - 45
            balanceAfter: 50,
          }),
        }),
      );
    });
  });

  describe('checkAvailability', () => {
    it('should return OUT_OF_STOCK and include alternatives when stock is 0', async () => {
      mockPrisma.medicine.findUnique.mockResolvedValueOnce({
        id: 'med-1',
        name: 'Amoxicillin 500mg',
        genericName: 'Amoxicillin',
        strength: '500mg',
        dosageForm: 'CAPSULE',
        unit: 'capsules',
      });

      mockPrisma.medicineStock.findUnique.mockResolvedValueOnce({
        currentStock: 0,
        reorderLevel: 10,
        lastUpdatedAt: new Date(Date.now() - 30 * 60 * 1000), // 30m ago
      });

      // Alternative mapping
      mockPrisma.medicineAlternative.findMany.mockResolvedValueOnce([
        {
          notes: 'Therapeutic substitute',
          alternativeMedicine: {
            id: 'med-alt-1',
            name: 'Ampicillin 500mg',
            genericName: 'Ampicillin',
            strength: '500mg',
            dosageForm: 'CAPSULE',
            unit: 'capsules',
            Stocks: [
              {
                currentStock: 40,
                reorderLevel: 10,
                unit: 'capsules',
                lastUpdatedAt: new Date(),
              },
            ],
          },
        },
      ]);

      mockPrisma.medicine.findMany.mockResolvedValueOnce([]);

      const result = await service.checkAvailability('fac-1', 'med-1');

      expect(result.status).toBe(StockStatus.OUT_OF_STOCK);
      expect(result.isStale).toBe(false);
      expect(result.alternatives).toHaveLength(1);
      expect(result.alternatives[0].name).toBe('Ampicillin 500mg');
      expect(result.alternatives[0].currentStock).toBe(40);
      expect(result.alternatives[0].status).toBe(StockStatus.AVAILABLE);
      expect(result.clinicalNote).toBeDefined();
    });

    it('should mark stock as stale if last updated > threshold', async () => {
      mockPrisma.medicine.findUnique.mockResolvedValueOnce({
        id: 'med-1',
        name: 'Paracetamol 500mg',
        genericName: 'Paracetamol',
        strength: '500mg',
        dosageForm: 'TABLET',
        unit: 'tablets',
      });

      const threeHoursAgo = new Date(Date.now() - 180 * 60 * 1000);
      mockPrisma.medicineStock.findUnique.mockResolvedValueOnce({
        currentStock: 50,
        reorderLevel: 10,
        lastUpdatedAt: threeHoursAgo,
      });

      mockPrisma.medicineAlternative.findMany.mockResolvedValueOnce([]);
      mockPrisma.medicine.findMany.mockResolvedValueOnce([]);

      const result = await service.checkAvailability('fac-1', 'med-1');

      expect(result.status).toBe(StockStatus.AVAILABLE);
      expect(result.isStale).toBe(true);
      expect(result.ageMinutes).toBeGreaterThanOrEqual(180);
    });
  });

  describe('getStaleInventory', () => {
    it('should group stale medicines by facility for D3 escalation', async () => {
      const fourHoursAgo = new Date(Date.now() - 240 * 60 * 1000);

      mockPrisma.medicineStock.findMany.mockResolvedValueOnce([
        {
          id: 'stock-1',
          currentStock: 25,
          lastUpdatedAt: fourHoursAgo,
          facility: {
            id: 'fac-1',
            name: 'Rural PHC Baramati',
            district: 'Pune',
            contactPhone: '+919876543210',
          },
          medicine: {
            id: 'med-1',
            name: 'Paracetamol 500mg',
          },
        },
      ]);

      const result = await service.getStaleInventory({ district: 'Pune' });

      expect(result.totalStaleStocks).toBe(1);
      expect(result.affectedFacilitiesCount).toBe(1);
      expect(result.facilities[0].facilityName).toBe('Rural PHC Baramati');
      expect(result.facilities[0].staleItemCount).toBe(1);
    });
  });

  describe('recordIntake (idempotency)', () => {
    it('should return cached transaction if idempotencyKey already exists', async () => {
      const cachedTx = {
        id: 'tx-existing',
        facilityId: 'fac-1',
        stockId: 'stock-1',
        medicineId: 'med-1',
        type: StockTransactionType.RECEIPT,
        quantity: 50,
        balanceAfter: 150,
        stock: { id: 'stock-1', currentStock: 150 },
      };

      mockPrisma.stockTransaction.findUnique.mockResolvedValueOnce(cachedTx);

      const result = await service.recordIntake({
        facilityId: 'fac-1',
        medicineId: 'med-1',
        quantity: 50,
        idempotencyKey: 'retry-key-123',
      });

      expect(result.idempotentReplay).toBe(true);
      expect(result.transaction.id).toBe('tx-existing');
      expect(mockPrisma.facility.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('checkPrescriptionAvailability', () => {
    it('should check all items and provide alternatives when an item is unavailable', async () => {
      mockPrisma.facility.findUnique.mockResolvedValueOnce({
        id: 'fac-1',
        name: 'PHC Shirur',
        district: 'Pune',
      });

      // Mock item 1: Paracetamol (available)
      mockPrisma.medicine.findUnique
        .mockResolvedValueOnce({
          id: 'med-1',
          name: 'Paracetamol 500mg',
          genericName: 'Paracetamol',
          strength: '500mg',
          dosageForm: 'TABLET',
          unit: 'tablets',
        })
        // Mock item 2: Amoxicillin (out of stock)
        .mockResolvedValueOnce({
          id: 'med-2',
          name: 'Amoxicillin 500mg',
          genericName: 'Amoxicillin',
          strength: '500mg',
          dosageForm: 'CAPSULE',
          unit: 'capsules',
        });

      mockPrisma.medicineStock.findUnique
        .mockResolvedValueOnce({
          currentStock: 100,
          reorderLevel: 10,
          unit: 'tablets',
          lastUpdatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          currentStock: 0,
          reorderLevel: 10,
          unit: 'capsules',
          lastUpdatedAt: new Date(),
        });

      mockPrisma.medicineAlternative.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
        {
          notes: 'Clinically approved alternative',
          alternativeMedicine: {
            id: 'med-alt',
            name: 'Ampicillin 500mg',
            genericName: 'Ampicillin',
            strength: '500mg',
            dosageForm: 'CAPSULE',
            unit: 'capsules',
            Stocks: [
              {
                currentStock: 50,
                reorderLevel: 10,
                unit: 'capsules',
                lastUpdatedAt: new Date(),
              },
            ],
          },
        },
      ]);
      mockPrisma.medicine.findMany.mockResolvedValueOnce([]);

      const result = await service.checkPrescriptionAvailability({
        facilityId: 'fac-1',
        items: [
          { medicineId: 'med-1', quantity: 20 },
          { medicineId: 'med-2', quantity: 15 },
        ],
      });

      expect(result.allAvailable).toBe(false);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].canFulfill).toBe(true);
      expect(result.items[1].canFulfill).toBe(false);
      expect(result.items[1].alternatives).toHaveLength(1);
      expect(result.items[1].alternatives[0].canFulfillAlternative).toBe(true);
      expect(result.clinicalWarning).toContain('prescribing clinician');
    });
  });

  describe('importInventory', () => {
    it('should validate each row, report row-level errors, and import valid rows', async () => {
      mockPrisma.facility.findUnique.mockResolvedValueOnce({ id: 'fac-1' });
      mockPrisma.inventoryImportBatch.findUnique.mockResolvedValueOnce(null);

      // Row 1: Valid medicine
      mockPrisma.medicine.findUnique.mockResolvedValueOnce({
        id: 'med-1',
        name: 'Paracetamol 500mg',
        unit: 'tablets',
      });

      mockPrisma.medicineStock.upsert.mockResolvedValueOnce({
        id: 'stock-1',
        currentStock: 100,
      });
      mockPrisma.stockTransaction.create.mockResolvedValueOnce({ id: 'tx-1' });

      // Row 2: Unknown medicine
      mockPrisma.medicine.findUnique.mockResolvedValueOnce(null);
      mockPrisma.medicine.findFirst.mockResolvedValueOnce(null);

      // Row 3: Invalid quantity <= 0
      // Will be caught before DB query

      const result = await service.importInventory({
        facilityId: 'fac-1',
        idempotencyKey: 'import-batch-001',
        rows: [
          { rowNumber: 1, medicineId: 'med-1', quantity: 100 },
          { rowNumber: 2, medicineName: 'Nonexistent Medicine XYZ', quantity: 50 },
          { rowNumber: 3, medicineId: 'med-1', quantity: 0 },
        ],
      });

      expect(result.totalRows).toBe(3);
      expect(result.successfulRows).toBe(1);
      expect(result.failedRows).toBe(2);
      const errors = result.errors as Array<{ row: number; reason: string }>;
      expect(errors).toHaveLength(2);
      expect(errors[0].row).toBe(2);
      expect(errors[0].reason).toContain('not found');
      expect(errors[1].row).toBe(3);
      expect(errors[1].reason).toContain('quantity');
      expect(mockPrisma.inventoryImportBatch.create).toHaveBeenCalled();
    });

    it('should return existing batch summary on idempotent replay', async () => {
      mockPrisma.facility.findUnique.mockResolvedValueOnce({ id: 'fac-1' });
      mockPrisma.inventoryImportBatch.findUnique.mockResolvedValueOnce({
        facilityId: 'fac-1',
        idempotencyKey: 'import-batch-001',
        totalRows: 10,
        successfulRows: 10,
        failedRows: 0,
        errors: [],
      });

      const result = await service.importInventory({
        facilityId: 'fac-1',
        idempotencyKey: 'import-batch-001',
        rows: [],
      });

      expect(result.idempotentReplay).toBe(true);
      expect(result.totalRows).toBe(10);
      expect(mockPrisma.medicineStock.upsert).not.toHaveBeenCalled();
    });
  });
});
