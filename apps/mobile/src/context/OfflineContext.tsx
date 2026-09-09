// Global Connectivity & Offline State Provider for CareGrid Mobile
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NetworkStatus } from '../types';
import { syncService, PushMutationDto } from '../services/sync.service';
import { formatElapsedTime } from '../components/StaleDataWarning';

export interface OfflineContextType {
  networkStatus: NetworkStatus;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  lastSyncedText: string;
  pendingCount: number;
  pendingMutations: PushMutationDto[];
  syncError: string | null;
  setOnlineStatus: (online: boolean) => void;
  triggerSync: (facilityId?: string) => Promise<boolean>;
  enqueueMutation: (
    entity: PushMutationDto['entity'],
    action: PushMutationDto['action'],
    payload: Record<string, any>,
  ) => PushMutationDto;
  removeMutation: (id: string) => void;
  clearPendingQueue: () => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    return syncService.getLastSyncedAt();
  });
  const [pendingMutations, setPendingMutations] = useState<PushMutationDto[]>(() => {
    return syncService.getOfflineQueue();
  });

  // Calculate high-level NetworkStatus
  const networkStatus: NetworkStatus = isSyncing
    ? 'SYNCING'
    : !isOnline
    ? 'OFFLINE'
    : syncError
    ? 'SYNC_FAILED'
    : 'ONLINE';

  // Format human-readable relative time
  const lastSyncedText = lastSyncedAt ? formatElapsedTime(lastSyncedAt).displayText : 'Never synced';

  const refreshQueue = useCallback(() => {
    setPendingMutations(syncService.getOfflineQueue());
  }, []);

  const triggerSync = useCallback(
    async (facilityId?: string): Promise<boolean> => {
      if (!isOnline) return false;
      setIsSyncing(true);
      setSyncError(null);
      try {
        const { pullResult } = await syncService.performFullSync(facilityId);
        setLastSyncedAt(pullResult.timestamp);
        refreshQueue();
        return true;
      } catch (err: any) {
        const msg = err?.message || 'Synchronization failed';
        setSyncError(msg);
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [isOnline, refreshQueue],
  );

  const enqueueMutation = useCallback(
    (
      entity: PushMutationDto['entity'],
      action: PushMutationDto['action'],
      payload: Record<string, any>,
    ): PushMutationDto => {
      const mut = syncService.enqueueMutation(entity, action, payload);
      refreshQueue();
      // If currently online, trigger background sync
      if (isOnline) {
        triggerSync().catch(() => {});
      }
      return mut;
    },
    [isOnline, refreshQueue, triggerSync],
  );

  const removeMutation = useCallback(
    (id: string) => {
      syncService.dequeueMutation(id);
      refreshQueue();
    },
    [refreshQueue],
  );

  const clearPendingQueue = useCallback(() => {
    syncService.clearQueue();
    refreshQueue();
  }, [refreshQueue]);

  // Window event listeners for online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setSyncError(null);
      // Automatically trigger sync upon reconnection
      triggerSync().catch(() => {});
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSync]);

  return (
    <OfflineContext.Provider
      value={{
        networkStatus,
        isOnline,
        isSyncing,
        lastSyncedAt,
        lastSyncedText,
        pendingCount: pendingMutations.length,
        pendingMutations,
        syncError,
        setOnlineStatus: setIsOnline,
        triggerSync,
        enqueueMutation,
        removeMutation,
        clearPendingQueue,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

export default OfflineContext;
