// Offline Queue Screen — View and Manage Pending Offline Writes & Sync Retries
import React from 'react';
import { useOffline } from '../../context/OfflineContext';
import { Colors, Spacing, Typography } from '../../theme';
import {
  Button,
  EmptyState,
  OfflineBanner,
  StaleDataWarning,
  StatusBadge,
  SyncStatus,
} from '../../components';

export interface OfflineQueueScreenProps {
  onNavigateBack?: () => void;
}

export const OfflineQueueScreen: React.FC<OfflineQueueScreenProps> = ({ onNavigateBack }) => {
  const {
    networkStatus,
    isOnline,
    isSyncing,
    lastSyncedAt,
    lastSyncedText,
    pendingMutations,
    pendingCount,
    syncError,
    triggerSync,
    removeMutation,
    clearPendingQueue,
  } = useOffline();

  const handleSyncNow = () => {
    triggerSync();
  };

  return (
    <div
      data-testid="offline-queue-screen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: Colors.background,
      }}
    >
      {/* Offline Alert Banner */}
      <OfflineBanner
        status={networkStatus}
        lastSyncedText={lastSyncedText}
        onRetrySync={handleSyncNow}
        testID="offline-banner"
      />

      {/* Header */}
      <div
        style={{
          padding: `${Spacing.md}px ${Spacing.lg}px`,
          backgroundColor: Colors.surface,
          borderBottom: `1px solid ${Colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          {onNavigateBack && (
            <button
              onClick={onNavigateBack}
              data-testid="back-button"
              style={{
                background: 'none',
                border: 'none',
                color: Colors.primary,
                cursor: 'pointer',
                fontSize: Typography.fontSizes.sm,
                fontWeight: Typography.fontWeights.medium,
                padding: 0,
                marginBottom: Spacing.xs,
              }}
            >
              ← Back
            </button>
          )}
          <h2
            style={{
              margin: 0,
              fontSize: Typography.fontSizes.lg,
              fontWeight: Typography.fontWeights.bold,
              color: Colors.textPrimary,
            }}
          >
            Offline Write Queue
          </h2>
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
            Local mutations waiting to sync with central servers
          </span>
        </div>

        <div style={{ display: 'flex', gap: Spacing.sm, alignItems: 'center' }}>
          <SyncStatus
            status={networkStatus}
            pendingCount={pendingCount}
            lastSyncedText={lastSyncedText}
          />
          <Button
            title={isSyncing ? 'Syncing...' : 'Sync Now'}
            variant="primary"
            onPress={handleSyncNow}
            isLoading={isSyncing}
            disabled={!isOnline || isSyncing}
            testID="manual-sync-btn"
          />
        </div>
      </div>

      {/* Status Bar */}
      <div
        style={{
          padding: `${Spacing.sm}px ${Spacing.lg}px`,
          backgroundColor: Colors.surfaceSubtle,
          borderBottom: `1px solid ${Colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
            Last Synced: <strong>{lastSyncedText}</strong>
          </span>
          {lastSyncedAt && (
            <StaleDataWarning lastUpdatedAt={lastSyncedAt} resourceName="server database" />
          )}
        </div>

        {pendingCount > 0 && (
          <button
            onClick={clearPendingQueue}
            data-testid="clear-queue-btn"
            style={{
              background: 'none',
              border: 'none',
              color: Colors.status.outOfStock.text,
              fontSize: Typography.fontSizes.xs,
              cursor: 'pointer',
              fontWeight: Typography.fontWeights.medium,
            }}
          >
            Discard All ({pendingCount})
          </button>
        )}
      </div>

      {/* Sync Error Banner */}
      {syncError && (
        <div
          data-testid="sync-error-banner"
          style={{
            padding: `${Spacing.sm}px ${Spacing.lg}px`,
            backgroundColor: Colors.status.outOfStock.bg,
            borderBottom: `1px solid ${Colors.status.outOfStock.border}`,
            color: Colors.status.outOfStock.text,
            fontSize: Typography.fontSizes.xs,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>⚠️ {syncError}</span>
          <button
            onClick={handleSyncNow}
            style={{
              background: 'none',
              border: 'none',
              color: Colors.status.outOfStock.text,
              fontWeight: Typography.fontWeights.bold,
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: Typography.fontSizes.xs,
            }}
          >
            Retry Now
          </button>
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, padding: Spacing.lg, overflowY: 'auto' }}>
        {pendingCount === 0 ? (
          <EmptyState
            title="All Changes Synced"
            description="Your device is in sync with the central CareGrid server. No pending offline actions."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: Spacing.sm }}>
            {pendingMutations.map((mut, idx) => (
              <div
                key={mut.id}
                data-testid={`queue-item-${mut.id}`}
                style={{
                  backgroundColor: Colors.surface,
                  border: `1px solid ${Colors.border}`,
                  borderRadius: Spacing.borderRadius.lg,
                  padding: Spacing.md,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
                    <span style={{ fontWeight: Typography.fontWeights.bold, fontSize: Typography.fontSizes.sm, color: Colors.textPrimary }}>
                      #{idx + 1} • {mut.action} {mut.entity}
                    </span>
                    <StatusBadge
                      label={isSyncing ? 'SYNCING' : 'PENDING'}
                      variant={isSyncing ? 'pending' : 'lowStock'}
                    />
                  </div>

                  <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary, marginTop: 4 }}>
                    Logged at: {new Date(mut.clientTimestamp).toLocaleTimeString()} • ID: {mut.id.slice(0, 16)}...
                  </div>

                  <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted, marginTop: 2, fontFamily: 'monospace' }}>
                    {JSON.stringify(mut.payload).slice(0, 80)}...
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
                  <Button
                    title="Remove"
                    variant="outline"
                    onPress={() => removeMutation(mut.id)}
                    testID={`remove-mut-${mut.id}`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineQueueScreen;
