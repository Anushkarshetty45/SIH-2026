// Global Connectivity & Offline State Provider for CareGrid Mobile — React Native
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { NetworkStatus } from '../types';
import { syncService, PushMutationDto, initSyncStorage } from '../services/sync.service';
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
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    return syncService.getLastSyncedAt();
  });
  const [pendingMutations, setPendingMutations] = useState<PushMutationDto[]>(() => {
    return syncService.getOfflineQueue();
  });

  // Hydrate from AsyncStorage on startup
  useEffect(() => {
    initSyncStorage().then(() => {
      setLastSyncedAt(syncService.getLastSyncedAt());
      setPendingMutations(syncService.getOfflineQueue());
    });
  }, []);

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

  // NetInfo network state listeners for React Native
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline((prevOnline) => {
        // If transitioning from offline to online, trigger background sync
        if (!prevOnline && online) {
          setSyncError(null);
          triggerSync().catch(() => {});
        }
        return online;
      });
    });

    return () => {
      unsubscribe();
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
