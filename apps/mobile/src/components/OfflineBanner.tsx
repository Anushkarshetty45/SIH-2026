// Connectivity & Offline Banner
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';
import { NetworkStatus } from '../types';

export interface OfflineBannerProps {
  status: NetworkStatus;
  lastSyncedText?: string;
  onRetrySync?: () => void;
  testID?: string;
  style?: React.CSSProperties;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  status,
  lastSyncedText,
  onRetrySync,
  testID,
  style,
}) => {
  if (status === 'ONLINE') {
    return null; // When connected, do not clutter screen with persistent banner
  }

  const getConfig = () => {
    switch (status) {
      case 'OFFLINE':
        return {
          bg: Colors.connectivity.offline.bg,
          color: Colors.connectivity.offline.text,
          border: Colors.status.rejected.border,
          icon: '⚡',
          label: 'OFFLINE',
          details: lastSyncedText ? `Last synced ${lastSyncedText}` : 'Using cached data',
        };
      case 'SYNCING':
        return {
          bg: Colors.connectivity.syncing.bg,
          color: Colors.connectivity.syncing.text,
          border: Colors.border,
          icon: '🔄',
          label: 'SYNCING...',
          details: 'Updating data with server',
        };
      case 'SYNC_FAILED':
        return {
          bg: Colors.connectivity.syncFailed.bg,
          color: Colors.connectivity.syncFailed.text,
          border: Colors.status.lowStock.border,
          icon: '⚠️',
          label: 'SYNC FAILED',
          details: 'Tap to retry sync',
        };
      default:
        return null;
    }
  };

  const config = getConfig();
  if (!config) return null;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: Spacing.md,
    paddingRight: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    backgroundColor: config.bg,
    color: config.color,
    borderBottom: `1px solid ${config.border}`,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
    boxSizing: 'border-box',
    width: '100%',
    cursor: status === 'SYNC_FAILED' && onRetrySync ? 'pointer' : 'default',
    ...style,
  };

  return (
    <div
      style={containerStyle}
      data-testid={testID}
      role="status"
      onClick={status === 'SYNC_FAILED' ? onRetrySync : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
        <span aria-hidden="true">{config.icon}</span>
        <span style={{ fontWeight: Typography.fontWeights.bold }}>{config.label}</span>
        {config.details && <span style={{ opacity: 0.9 }}>• {config.details}</span>}
      </div>
      {status === 'SYNC_FAILED' && onRetrySync && (
        <span style={{ fontSize: Typography.fontSizes.xs, textDecoration: 'underline' }}>
          Retry
        </span>
      )}
    </div>
  );
};

export default OfflineBanner;
