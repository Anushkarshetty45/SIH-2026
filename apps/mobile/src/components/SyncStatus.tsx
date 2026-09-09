// Compact Sync Status Indicator Pill
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';
import { NetworkStatus } from '../types';

export interface SyncStatusProps {
  status: NetworkStatus;
  pendingCount?: number;
  lastSyncedText?: string;
  testID?: string;
  style?: React.CSSProperties;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({
  status,
  pendingCount = 0,
  lastSyncedText,
  testID,
  style,
}) => {
  const getIndicatorColor = () => {
    switch (status) {
      case 'ONLINE':
        return Colors.connectivity.online.indicator;
      case 'OFFLINE':
        return Colors.connectivity.offline.indicator;
      case 'SYNCING':
        return Colors.connectivity.syncing.indicator;
      case 'SYNC_FAILED':
        return Colors.connectivity.syncFailed.indicator;
      default:
        return Colors.border;
    }
  };

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingLeft: Spacing.sm,
    paddingRight: Spacing.sm,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Spacing.borderRadius.full,
    border: `1px solid ${Colors.borderLight}`,
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    ...style,
  };

  const dotStyle: React.CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: getIndicatorColor(),
  };

  return (
    <div style={containerStyle} data-testid={testID} role="status">
      <span style={dotStyle} aria-hidden="true" />
      <span>{status}</span>
      {pendingCount > 0 && (
        <span style={{ fontWeight: Typography.fontWeights.semibold, color: Colors.status.lowStock.text }}>
          ({pendingCount} pending)
        </span>
      )}
      {lastSyncedText && status !== 'SYNCING' && (
        <span style={{ color: Colors.textMuted }}>• {lastSyncedText}</span>
      )}
    </div>
  );
};

export default SyncStatus;
