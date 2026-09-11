import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';

export interface PushMutationDto {
  id: string; // UUID idempotency key
  entity: 'PATIENT' | 'REFERRAL' | 'APPOINTMENT' | 'BED' | 'EQUIPMENT' | 'STOCK_TRANSACTION';
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: Record<string, any>;
  clientTimestamp: string;
}

export interface PullSyncQuery {
  since?: string;
  facilityId?: string;
}

export interface PullSyncResponse {
  timestamp: string;
  facilities: any[];
  doctors: any[];
  beds: any[];
  equipment: any[];
  medicineStocks: any[];
  referrals: any[];
  appointments: any[];
  patients?: any[];
}

export interface PushSyncResponse {
  processedCount: number;
  successCount: number;
  failedCount: number;
  results: Array<{
    id: string;
    idempotencyKey?: string;
    status: 'SUCCESS' | 'CONFLICT' | 'FAILED';
    error?: string;
  }>;
}

const OFFLINE_QUEUE_KEY = 'caregrid_offline_mutation_queue';
const LAST_SYNC_KEY = 'caregrid_last_synced_timestamp';

// In-memory cache for instant synchronous access in React renders
const inMemoryStore = new Map<string, string>();

// Initialize memory store from AsyncStorage asynchronously on startup
export const initSyncStorage = async (): Promise<void> => {
  try {
    const keys = [OFFLINE_QUEUE_KEY, LAST_SYNC_KEY];
    const pairs = await AsyncStorage.multiGet(keys);
    pairs.forEach(([key, val]) => {
      if (val !== null) {
        inMemoryStore.set(key, val);
      }
    });
  } catch (err) {
    console.warn('[SyncService] Failed to hydrate from AsyncStorage:', err);
  }
};

// Immediate background attempt to hydrate in case initSyncStorage is not awaited
initSyncStorage().catch(() => {});

const storage = {
  getItem: (key: string): string | null => {
    return inMemoryStore.get(key) || null;
  },
  setItem: (key: string, value: string): void => {
    inMemoryStore.set(key, value);
    AsyncStorage.setItem(key, value).catch((err) => {
      console.warn('[SyncService] AsyncStorage setItem error:', err);
    });
  },
  removeItem: (key: string): void => {
    inMemoryStore.delete(key);
    AsyncStorage.removeItem(key).catch((err) => {
      console.warn('[SyncService] AsyncStorage removeItem error:', err);
    });
  },
};

export const syncService = {
  /**
   * Pull delta updates from backend since last sync timestamp (optimized for 2G)
   */
  pull: (query?: PullSyncQuery): Promise<PullSyncResponse> =>
    api.get<PullSyncResponse>('/sync/pull', { params: query }),

  /**
   * Push batched offline mutations to server
   */
  push: (mutations: PushMutationDto[]): Promise<PushSyncResponse> =>
    api.post<PushSyncResponse>('/sync/push', { mutations }),

  /**
   * Get pending mutations stored in local storage
   */
  getOfflineQueue: (): PushMutationDto[] => {
    try {
      const stored = storage.getItem(OFFLINE_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  /**
   * Save mutation queue to local storage
   */
  saveOfflineQueue: (queue: PushMutationDto[]): void => {
    try {
      storage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch {}
  },

  /**
   * Enqueue an offline mutation for later sync
   */
  enqueueMutation: (
    entity: PushMutationDto['entity'],
    action: PushMutationDto['action'],
    payload: Record<string, any>,
  ): PushMutationDto => {
    const mutation: PushMutationDto = {
      id: `mut-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entity,
      action,
      payload,
      clientTimestamp: new Date().toISOString(),
    };

    const current = syncService.getOfflineQueue();
    current.push(mutation);
    syncService.saveOfflineQueue(current);
    return mutation;
  },

  /**
   * Remove a specific mutation from local queue
   */
  dequeueMutation: (id: string): void => {
    const current = syncService.getOfflineQueue();
    const filtered = current.filter((m) => m.id !== id);
    syncService.saveOfflineQueue(filtered);
  },

  /**
   * Clear all pending mutations
   */
  clearQueue: (): void => {
    syncService.saveOfflineQueue([]);
  },

  /**
   * Get last sync timestamp
   */
  getLastSyncedAt: (): string | null => {
    try {
      return storage.getItem(LAST_SYNC_KEY);
    } catch {
      return null;
    }
  },

  /**
   * Set last sync timestamp
   */
  setLastSyncedAt: (timestamp: string): void => {
    try {
      storage.setItem(LAST_SYNC_KEY, timestamp);
    } catch {}
  },

  /**
   * Full Sync: Push pending mutations then pull delta updates
   */
  performFullSync: async (facilityId?: string): Promise<{
    pushResult: PushSyncResponse | null;
    pullResult: PullSyncResponse;
  }> => {
    const queue = syncService.getOfflineQueue();
    let pushResult: PushSyncResponse | null = null;

    if (queue.length > 0) {
      pushResult = await syncService.push(queue);
      // Remove successfully processed mutations
      const failedIds = new Set(
        pushResult.results.filter((r) => r.status === 'FAILED').map((r) => r.id),
      );
      const remaining = queue.filter((m) => failedIds.has(m.id));
      syncService.saveOfflineQueue(remaining);
    }

    const lastSync = syncService.getLastSyncedAt() || undefined;
    const pullResult = await syncService.pull({ facilityId, since: lastSync });

    if (pullResult.timestamp) {
      syncService.setLastSyncedAt(pullResult.timestamp);
    }

    return { pushResult, pullResult };
  },
};
