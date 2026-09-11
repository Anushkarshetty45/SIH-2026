import { syncService } from '../src/services/sync.service';
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

describe('Milestone 5: Offline/2G Sync & Write Queue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    syncService.clearQueue();
  });

  describe('Offline Mutation Queue Management', () => {
    it('should enqueue offline mutations with client timestamp and idempotency ID', () => {
      const mutation = syncService.enqueueMutation('REFERRAL', 'CREATE', {
        patientId: 'pat-001',
        toFacilityId: 'fac-002',
        urgency: 'HIGH',
      });

      expect(mutation.id).toMatch(/^mut-/);
      expect(mutation.entity).toBe('REFERRAL');
      expect(mutation.action).toBe('CREATE');
      expect(mutation.payload.patientId).toBe('pat-001');
      expect(mutation.clientTimestamp).toBeDefined();

      const queue = syncService.getOfflineQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe(mutation.id);
    });

    it('should dequeue individual mutations by id', () => {
      const mut1 = syncService.enqueueMutation('PATIENT', 'CREATE', { name: 'Aarav Patil' });
      const mut2 = syncService.enqueueMutation('APPOINTMENT', 'CREATE', { slotId: 'slot-123' });

      expect(syncService.getOfflineQueue()).toHaveLength(2);

      syncService.dequeueMutation(mut1.id);

      const queue = syncService.getOfflineQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe(mut2.id);
    });

    it('should clear the entire offline queue', () => {
      syncService.enqueueMutation('PATIENT', 'CREATE', { name: 'Patient 1' });
      syncService.enqueueMutation('PATIENT', 'CREATE', { name: 'Patient 2' });

      expect(syncService.getOfflineQueue()).toHaveLength(2);

      syncService.clearQueue();

      expect(syncService.getOfflineQueue()).toHaveLength(0);
    });
  });

  describe('D3 Backend Sync Integration (Push / Pull)', () => {
    it('should pull delta updates since a given timestamp', async () => {
      const mockPullResponse = {
        timestamp: new Date().toISOString(),
        facilities: [{ id: 'fac-1', name: 'PHC Shirwal' }],
        doctors: [{ id: 'doc-1', name: 'Dr. Deshmukh' }],
        beds: [{ id: 'bed-1', status: 'AVAILABLE' }],
        equipment: [],
        medicineStocks: [],
        referrals: [],
        appointments: [],
      };

      (api.get as jest.Mock).mockResolvedValueOnce(mockPullResponse);

      const result = await syncService.pull({ facilityId: 'fac-1', since: '2026-09-08T00:00:00Z' });

      expect(api.get).toHaveBeenCalledWith('/sync/pull', {
        params: { facilityId: 'fac-1', since: '2026-09-08T00:00:00Z' },
      });
      expect(result.facilities).toHaveLength(1);
      expect(result.doctors[0].name).toBe('Dr. Deshmukh');
    });

    it('should push offline mutations to backend and return batch execution results', async () => {
      const mutations = [
        {
          id: 'mut-100',
          entity: 'REFERRAL' as const,
          action: 'CREATE' as const,
          payload: { patientId: 'p1' },
          clientTimestamp: new Date().toISOString(),
        },
      ];

      const mockPushResponse = {
        processedCount: 1,
        successCount: 1,
        failedCount: 0,
        results: [
          {
            id: 'mut-100',
            status: 'SUCCESS',
          },
        ],
      };

      (api.post as jest.Mock).mockResolvedValueOnce(mockPushResponse);

      const result = await syncService.push(mutations);

      expect(api.post).toHaveBeenCalledWith('/sync/push', { mutations });
      expect(result.successCount).toBe(1);
      expect(result.results[0].status).toBe('SUCCESS');
    });

    it('should execute full sync workflow: push queue and pull deltas', async () => {
      syncService.enqueueMutation('APPOINTMENT', 'CREATE', { slotId: 'slot-1' });

      const mockPushResponse = {
        processedCount: 1,
        successCount: 1,
        failedCount: 0,
        results: [{ id: 'mut-xxx', status: 'SUCCESS' }],
      };

      const mockPullResponse = {
        timestamp: '2026-09-08T18:00:00Z',
        facilities: [],
        doctors: [],
        beds: [],
        equipment: [],
        medicineStocks: [],
        referrals: [],
        appointments: [],
      };

      (api.post as jest.Mock).mockResolvedValueOnce(mockPushResponse);
      (api.get as jest.Mock).mockResolvedValueOnce(mockPullResponse);

      const { pushResult, pullResult } = await syncService.performFullSync('fac-1');

      expect(pushResult).toBeDefined();
      expect(pullResult.timestamp).toBe('2026-09-08T18:00:00Z');
      expect(syncService.getLastSyncedAt()).toBe('2026-09-08T18:00:00Z');
    });

    it('should retain failed mutations in queue during full sync for later retry', async () => {
      const mut1 = syncService.enqueueMutation('REFERRAL', 'CREATE', { patientId: 'pat-fail' });

      const mockPushResponse = {
        processedCount: 1,
        successCount: 0,
        failedCount: 1,
        results: [{ id: mut1.id, status: 'FAILED', error: 'Database constraint violation' }],
      };

      const mockPullResponse = {
        timestamp: '2026-09-08T18:05:00Z',
        facilities: [],
        doctors: [],
        beds: [],
        equipment: [],
        medicineStocks: [],
        referrals: [],
        appointments: [],
      };

      (api.post as jest.Mock).mockResolvedValueOnce(mockPushResponse);
      (api.get as jest.Mock).mockResolvedValueOnce(mockPullResponse);

      await syncService.performFullSync();

      const remainingQueue = syncService.getOfflineQueue();
      expect(remainingQueue).toHaveLength(1);
      expect(remainingQueue[0].id).toBe(mut1.id);
    });
  });
});
