// Frontend Types & Re-exports for CareGrid Mobile

export * from '@rhcp/shared-types';

export type NetworkStatus = 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'SYNC_FAILED';

export interface ConnectivityState {
  status: NetworkStatus;
  isOnline: boolean;
  lastSyncedAt: string | null;
  pendingMutationsCount: number;
}

export interface UserSession {
  accessToken: string;
  refreshToken: string;
  user: import('@rhcp/shared-types').AuthUser;
}

export interface StaleIndicatorProps {
  lastUpdatedAt: string | Date;
  staleThresholdMinutes?: number;
  label?: string;
}

export interface ConfirmationDialogConfig {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}
