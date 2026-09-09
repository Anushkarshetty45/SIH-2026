// Compact Sync Status Indicator Pill — React Native
import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography } from '../theme';
import { NetworkStatus } from '../types';

export interface SyncStatusProps {
  status: NetworkStatus;
  pendingCount?: number;
  lastSyncedText?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
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

  return (
    <View
      style={[styles.container, style]}
      testID={testID}
      accessibilityRole="summary"
    >
      <View
        style={[styles.dot, { backgroundColor: getIndicatorColor() }]}
        accessibilityElementsHidden={true}
        importantForAccessibility="no"
      />
      <Text style={styles.text}>{status}</Text>
      {pendingCount > 0 && (
        <Text style={styles.pendingText}>
          ({pendingCount} pending)
        </Text>
      )}
      {lastSyncedText && status !== 'SYNCING' && (
        <Text style={styles.lastSyncedText}>• {lastSyncedText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Spacing.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
  },
  pendingText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.status.lowStock.text,
  },
  lastSyncedText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },
});

export default SyncStatus;
