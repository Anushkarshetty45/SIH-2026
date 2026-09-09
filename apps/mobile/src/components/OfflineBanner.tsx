// Connectivity & Offline Banner — React Native
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme';
import { NetworkStatus } from '../types';

export interface OfflineBannerProps {
  status: NetworkStatus;
  lastSyncedText?: string;
  onRetrySync?: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
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

  const isClickable = status === 'SYNC_FAILED' && !!onRetrySync;
  const ContainerComponent = isClickable ? TouchableOpacity : View;

  return (
    <ContainerComponent
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          borderBottomColor: config.border,
        },
        style,
      ]}
      testID={testID}
      accessibilityRole={isClickable ? 'button' : 'summary'}
      accessibilityLabel={`${config.label}. ${config.details || ''}`}
      onPress={isClickable ? onRetrySync : undefined}
      activeOpacity={isClickable ? 0.7 : 1}
    >
      <View style={styles.leftRow}>
        <Text style={styles.icon} accessibilityElementsHidden={true} importantForAccessibility="no">
          {config.icon}
        </Text>
        <Text style={[styles.label, { color: config.color }]}>
          {config.label}
        </Text>
        {config.details && (
          <Text style={[styles.details, { color: config.color }]}>
            • {config.details}
          </Text>
        )}
      </View>
      {isClickable && (
        <Text style={[styles.retryText, { color: config.color }]}>
          Retry
        </Text>
      )}
    </ContainerComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    width: '100%',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 1,
  },
  icon: {
    fontSize: Typography.fontSizes.sm,
  },
  label: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
  },
  details: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
    opacity: 0.9,
    flexShrink: 1,
  },
  retryText: {
    fontSize: Typography.fontSizes.xs,
    textDecorationLine: 'underline',
    fontWeight: Typography.fontWeights.bold,
    marginLeft: Spacing.sm,
  },
});

export default OfflineBanner;
