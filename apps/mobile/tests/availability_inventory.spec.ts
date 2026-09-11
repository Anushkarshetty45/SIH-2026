import { bedService } from '../src/services/bed.service';
import { equipmentService } from '../src/services/equipment.service';
import { medicineService } from '../src/services/medicine.service';
import { inventoryService } from '../src/services/inventory.service';
import { freshnessService } from '../src/services/freshness.service';
import { formatElapsedTime } from '../src/components/StaleDataWarning';
import { api } from '../src/api/client';

// Mock the API client
jest.mock('../src/api/client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Milestone 4: Availability + Inventory Services & Freshness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Bed Service (D2 API)', () => {
    it('should fetch facility bed summary by category with data freshness', async () => {
      const mockBedSummary = {
        facilityId: 'fac-phc-01',
        lastUpdatedAt: new Date().toISOString(),
        isStale: false,
        categories: [
          { category: 'GENERAL', total: 20, available: 8, occupied: 12 },
          { category: 'ICU', total: 4, available: 1, occupied: 3 },
          { category: 'OXYGEN', total: 10, available: 5, occupied: 5 },
        ],
      };

      (api.get as jest.Mock).mockResolvedValueOnce(mockBedSummary);

      const result = await bedService.getFacilityBedSummary('fac-phc-01');

      expect(api.get).toHaveBeenCalledWith('/facilities/fac-phc-01/beds');
      expect(result.facilityId).toBe('fac-phc-01');
      expect(result.categories).toHaveLength(3);
      expect(result.categories[0].available).toBe(8);
      expect(result.isStale).toBe(false);
    });

    it('should update bed status', async () => {
      const mockBed = {
        id: 'bed-101',
        facilityId: 'fac-phc-01',
        bedNumber: '101',
        ward: 'General',
        category: 'GENERAL',
        status: 'OCCUPIED',
        lastUpdatedAt: new Date().toISOString(),
      };

      (api.patch as jest.Mock).mockResolvedValueOnce(mockBed);

      const result = await bedService.updateBedStatus('bed-101', { status: 'OCCUPIED' });

      expect(api.patch).toHaveBeenCalledWith('/beds/bed-101', { status: 'OCCUPIED' });
      expect(result.status).toBe('OCCUPIED');
    });

    it('should query emergency bed availability with conservative freshness flags', async () => {
      const mockEmergency = [
        {
          facilityId: 'fac-chc-01',
          facilityName: 'Sub-District Hospital Pune',
          district: 'Pune',
          icuTotal: 10,
          icuAvailable: 2,
          oxygenTotal: 20,
          oxygenAvailable: 8,
          ventilatorTotal: 6,
          ventilatorAvailable: 1,
          lastUpdatedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // 3 hours ago -> stale
          isStale: true,
          unreliableForEmergency: true,
        },
      ];

      (api.get as jest.Mock).mockResolvedValueOnce(mockEmergency);

      const result = await bedService.getEmergencyBedAvailability('fac-chc-01', 'Pune');

      expect(api.get).toHaveBeenCalledWith('/beds/emergency-availability', {
        params: { facilityId: 'fac-chc-01', district: 'Pune' },
      });
      expect(result[0].unreliableForEmergency).toBe(true);
      expect(result[0].icuAvailable).toBe(2);
    });
  });

  describe('Equipment Service (D2 API)', () => {
    it('should fetch facility equipment with freshness status', async () => {
      const mockEquipData = {
        facilityId: 'fac-phc-01',
        lastUpdatedAt: new Date().toISOString(),
        isStale: false,
        equipment: [
          {
            id: 'eq-1',
            facilityId: 'fac-phc-01',
            name: 'Oxygen Concentrator',
            category: 'Respiratory',
            totalQuantity: 5,
            availableQuantity: 4,
            status: 'OPERATIONAL',
            lastUpdatedAt: new Date().toISOString(),
          },
        ],
      };

      (api.get as jest.Mock).mockResolvedValueOnce(mockEquipData);

      const result = await equipmentService.getFacilityEquipment('fac-phc-01');

      expect(api.get).toHaveBeenCalledWith('/facilities/fac-phc-01/equipment');
      expect(result.equipment[0].name).toBe('Oxygen Concentrator');
      expect(result.equipment[0].availableQuantity).toBe(4);
    });

    it('should update equipment status and quantities', async () => {
      const mockUpdated = {
        id: 'eq-1',
        facilityId: 'fac-phc-01',
        name: 'Oxygen Concentrator',
        category: 'Respiratory',
        totalQuantity: 5,
        availableQuantity: 3,
        status: 'OPERATIONAL',
        lastUpdatedAt: new Date().toISOString(),
      };

      (api.patch as jest.Mock).mockResolvedValueOnce(mockUpdated);

      const result = await equipmentService.updateEquipment('eq-1', {
        availableQuantity: 3,
        totalQuantity: 5,
        status: 'OPERATIONAL',
      });

      expect(api.patch).toHaveBeenCalledWith('/equipment/eq-1', {
        availableQuantity: 3,
        totalQuantity: 5,
        status: 'OPERATIONAL',
      });
      expect(result.availableQuantity).toBe(3);
    });
  });

  describe('Medicine & Inventory Service (D2 API)', () => {
    it('should search medicine catalog by generic name or brand', async () => {
      const mockMedicines = {
        data: [
          {
            id: 'med-pcm-500',
            name: 'Crocin 500mg',
            genericName: 'Paracetamol',
            dosageForm: 'Tablet',
            strength: '500mg',
            unit: 'tablets',
            isActive: true,
          },
        ],
        total: 1,
        page: 1,
        limit: 25,
        totalPages: 1,
      };

      (api.get as jest.Mock).mockResolvedValueOnce(mockMedicines);

      const result = await medicineService.searchMedicines({ search: 'Paracetamol' });

      expect(api.get).toHaveBeenCalledWith('/medicines', { params: { search: 'Paracetamol' } });
      expect(result.data[0].genericName).toBe('Paracetamol');
    });

    it('should fetch controlled deterministic alternatives without AI hallucination', async () => {
      const mockAlternatives = {
        primaryMedicine: {
          id: 'med-amox-500',
          name: 'Amoxil 500mg',
          genericName: 'Amoxicillin',
          dosageForm: 'Capsule',
          strength: '500mg',
          unit: 'capsules',
          isActive: true,
        },
        controlledAlternatives: [
          {
            id: 'med-aug-625',
            name: 'Augmentin 625mg',
            genericName: 'Amoxicillin + Clavulanic Acid',
            dosageForm: 'Tablet',
            strength: '625mg',
            unit: 'tablets',
            notes: 'Broad-spectrum controlled alternative',
            isAvailableAtFacility: true,
            currentStock: 45,
          },
        ],
        genericEquivalents: [
          {
            id: 'med-amox-gen-500',
            name: 'Amoxicillin Generic 500mg',
            genericName: 'Amoxicillin',
            dosageForm: 'Capsule',
            strength: '500mg',
            unit: 'capsules',
            isAvailableAtFacility: true,
            currentStock: 120,
          },
        ],
      };

      (api.get as jest.Mock).mockResolvedValueOnce(mockAlternatives);

      const result = await medicineService.getAlternatives('med-amox-500', 'fac-phc-01');

      expect(api.get).toHaveBeenCalledWith('/medicines/med-amox-500/alternatives', {
        params: { facilityId: 'fac-phc-01' },
      });
      expect(result.controlledAlternatives).toHaveLength(1);
      expect(result.genericEquivalents[0].genericName).toBe('Amoxicillin');
      expect(result.genericEquivalents[0].isAvailableAtFacility).toBe(true);
    });

    it('should check single medicine availability at facility', async () => {
      const mockCheck = {
        facilityId: 'fac-phc-01',
        medicineId: 'med-pcm-500',
        medicineName: 'Paracetamol 500mg',
        genericName: 'Paracetamol',
        currentStock: 150,
        unit: 'tablets',
        isAvailable: true,
        stockStatus: 'AVAILABLE',
        lastUpdatedAt: new Date().toISOString(),
        isStale: false,
        staleMinutes: 10,
        alternatives: [],
      };

      (api.get as jest.Mock).mockResolvedValueOnce(mockCheck);

      const result = await inventoryService.checkAvailability('fac-phc-01', 'med-pcm-500');

      expect(api.get).toHaveBeenCalledWith('/inventory/check', {
        params: { facilityId: 'fac-phc-01', medicineId: 'med-pcm-500' },
      });
      expect(result.isAvailable).toBe(true);
      expect(result.currentStock).toBe(150);
    });

    it('should perform multi-item prescription availability check with fallback alternatives', async () => {
      const mockPrescriptionCheck = {
        facilityId: 'fac-phc-01',
        allAvailable: false,
        lastUpdatedAt: new Date().toISOString(),
        isStale: false,
        items: [
          {
            medicineId: 'med-pcm-500',
            medicineName: 'Paracetamol 500mg',
            requestedQuantity: 20,
            currentStock: 100,
            isAvailable: true,
            alternatives: [],
          },
          {
            medicineId: 'med-amox-500',
            medicineName: 'Amoxicillin 500mg',
            requestedQuantity: 30,
            currentStock: 0,
            isAvailable: false,
            alternatives: [
              {
                id: 'med-aug-625',
                name: 'Augmentin 625mg',
                genericName: 'Amoxicillin + Clavulanic Acid',
                dosageForm: 'Tablet',
                strength: '625mg',
                unit: 'tablets',
                isAvailableAtFacility: true,
                currentStock: 50,
              },
            ],
          },
        ],
      };

      (api.post as jest.Mock).mockResolvedValueOnce(mockPrescriptionCheck);

      const result = await inventoryService.checkPrescriptionAvailability('fac-phc-01', [
        { medicineId: 'med-pcm-500', quantity: 20 },
        { medicineId: 'med-amox-500', quantity: 30 },
      ]);

      expect(api.post).toHaveBeenCalledWith('/inventory/check-prescription', {
        facilityId: 'fac-phc-01',
        items: [
          { medicineId: 'med-pcm-500', quantity: 20 },
          { medicineId: 'med-amox-500', quantity: 30 },
        ],
      });
      expect(result.allAvailable).toBe(false);
      expect(result.items[1].isAvailable).toBe(false);
      expect(result.items[1].alternatives[0].name).toBe('Augmentin 625mg');
    });

    it('should record stock intake for facility', async () => {
      const mockIntakeResponse = {
        transaction: {
          id: 'tx-intake-1',
          facilityId: 'fac-phc-01',
          medicineId: 'med-pcm-500',
          type: 'RECEIPT',
          quantity: 200,
          balanceAfter: 350,
          batchNumber: 'BATCH-2026-X',
          createdAt: new Date().toISOString(),
        },
        updatedStock: {
          id: 'stock-1',
          facilityId: 'fac-phc-01',
          medicineId: 'med-pcm-500',
          currentStock: 350,
          reorderLevel: 50,
          unit: 'tablets',
          lastUpdatedAt: new Date().toISOString(),
        },
      };

      (api.post as jest.Mock).mockResolvedValueOnce(mockIntakeResponse);

      const result = await inventoryService.recordIntake({
        facilityId: 'fac-phc-01',
        medicineId: 'med-pcm-500',
        quantity: 200,
        batchNumber: 'BATCH-2026-X',
      });

      expect(api.post).toHaveBeenCalledWith('/inventory/intake', {
        facilityId: 'fac-phc-01',
        medicineId: 'med-pcm-500',
        quantity: 200,
        batchNumber: 'BATCH-2026-X',
      });
      expect(result.updatedStock.currentStock).toBe(350);
    });

    it('should perform concurrency-safe stock adjustment (ISSUE)', async () => {
      const mockAdjustResponse = {
        transaction: {
          id: 'tx-adj-1',
          facilityId: 'fac-phc-01',
          medicineId: 'med-pcm-500',
          type: 'ISSUE',
          quantity: 20,
          balanceAfter: 330,
          notes: 'OPD Dispensation',
          createdAt: new Date().toISOString(),
        },
        updatedStock: {
          id: 'stock-1',
          facilityId: 'fac-phc-01',
          medicineId: 'med-pcm-500',
          currentStock: 330,
          reorderLevel: 50,
          unit: 'tablets',
          lastUpdatedAt: new Date().toISOString(),
        },
      };

      (api.post as jest.Mock).mockResolvedValueOnce(mockAdjustResponse);

      const result = await inventoryService.adjustStock({
        facilityId: 'fac-phc-01',
        medicineId: 'med-pcm-500',
        type: 'ISSUE',
        quantity: 20,
        reason: 'OPD Dispensation',
      });

      expect(api.post).toHaveBeenCalledWith('/inventory/adjust', {
        facilityId: 'fac-phc-01',
        medicineId: 'med-pcm-500',
        type: 'ISSUE',
        quantity: 20,
        reason: 'OPD Dispensation',
      });
      expect(result.updatedStock.currentStock).toBe(330);
    });
  });

  describe('Freshness & Staleness Rules', () => {
    it('should correctly calculate freshness elapsed time and stale flags', () => {
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      const threeHoursAgo = new Date(now.getTime() - 180 * 60 * 1000);

      const freshElapsed = formatElapsedTime(tenMinutesAgo);
      expect(freshElapsed.minutes).toBe(10);
      expect(freshElapsed.displayText).toBe('10 min ago');

      const staleElapsed = formatElapsedTime(threeHoursAgo);
      expect(staleElapsed.minutes).toBe(180);
      expect(staleElapsed.displayText).toBe('3h 0m ago');
    });

    it('should query unified freshness profile for a facility across all domains', async () => {
      const mockFreshness = {
        facilityId: 'fac-phc-01',
        facilityName: 'Shirwal Primary Health Centre',
        district: 'Satara',
        overallStatus: 'CURRENT',
        isStale: false,
        bedsLastUpdated: new Date().toISOString(),
        bedsStale: false,
        equipmentLastUpdated: new Date().toISOString(),
        equipmentStale: false,
        inventoryLastUpdated: new Date().toISOString(),
        inventoryStale: false,
        escalationTier: 'NONE',
      };

      (api.get as jest.Mock).mockResolvedValueOnce(mockFreshness);

      const result = await freshnessService.getFacilityFreshness('fac-phc-01');

      expect(api.get).toHaveBeenCalledWith('/freshness/facility/fac-phc-01');
      expect(result.overallStatus).toBe('CURRENT');
      expect(result.escalationTier).toBe('NONE');
    });
  });
});
