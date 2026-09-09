// Critical CareGrid Freshness & Stale Data Warning Component — React Native
import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography } from '../theme';
import { FreshnessStatus } from '../types';

export interface StaleDataWarningProps {
  lastUpdatedAt: string | Date;
  staleThresholdMinutes?: number; // Default 120 minutes (2 hours per SRS)
  isEmergencyMode?: boolean;
  resourceName?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Calculates human-readable elapsed time from an ISO timestamp
 */
export function formatElapsedTime(dateInput: string | Date): {
  minutes: number;
  displayText: string;
} {
  const now = new Date().getTime();
  const date = typeof dateInput === 'string' ? new Date(dateInput).getTime() : dateInput.getTime();

  if (isNaN(date)) {
    return { minutes: 0, displayText: 'Unknown' };
  }

  const diffMs = Math.max(0, now - date);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) {
    return { minutes: 0, displayText: 'just now' };
  }
  if (diffMinutes < 60) {
    return { minutes: diffMinutes, displayText: `${diffMinutes} min ago` };
  }
  const hours = Math.floor(diffMinutes / 60);
  const remainingMins = diffMinutes % 60;
  return {
    minutes: diffMinutes,
    displayText: `${hours}h ${remainingMins}m ago`,
  };
}

export const StaleDataWarning: React.FC<StaleDataWarningProps> = ({
  lastUpdatedAt,
  staleThresholdMinutes = 120, // 2 hours
  isEmergencyMode = false,
  resourceName = 'availability',
  testID,
  style,
}) => {
  const { minutes, displayText } = formatElapsedTime(lastUpdatedAt);
  const isStale = minutes >= staleThresholdMinutes;
  const status: FreshnessStatus = isNaN(new Date(lastUpdatedAt).getTime())
    ? 'UNKNOWN'
    : isStale
    ? 'STALE'
    : 'CURRENT';

  if (status === 'CURRENT') {
    return (
      <View
        testID={testID}
        style={[styles.currentContainer, style]}
      >
        <Text style={styles.currentIcon} accessibilityElementsHidden={true} importantForAccessibility="no">
          ✓
        </Text>
        <Text style={styles.currentText}>Current • Updated {displayText}</Text>
      </View>
    );
  }

  if (status === 'STALE') {
    return (
      <View
        testID={testID}
        accessibilityRole="alert"
        style={[styles.staleContainer, style]}
      >
        <View style={styles.staleHeader}>
          <Text style={styles.staleIcon} accessibilityElementsHidden={true} importantForAccessibility="no">
            ⚠️
          </Text>
          <Text style={styles.staleTitle}>
            STALE DATA WARNING
          </Text>
          <Text style={styles.staleSubtitle}>
            (Updated {displayText})
          </Text>
        </View>
        <Text style={styles.staleBody}>
          {isEmergencyMode
            ? `EMERGENCY ALERT: ${resourceName} was last updated ${displayText}. Place a direct voice call to confirm availability before patient dispatch.`
            : `Notice: Bed and facility ${resourceName} was last updated ${displayText}. Status may have changed.`}
        </Text>
      </View>
    );
  }

  // UNKNOWN Status
  return (
    <View
      testID={testID}
      style={[styles.unknownContainer, style]}
    >
      <Text style={styles.unknownIcon} accessibilityElementsHidden={true} importantForAccessibility="no">
        •
      </Text>
      <Text style={styles.unknownText}>Status Unknown • No recent updates</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  currentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.freshness.current.bg,
    borderWidth: 1,
    borderColor: Colors.freshness.current.border,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Spacing.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  currentIcon: {
    color: Colors.freshness.current.text,
    fontSize: Typography.fontSizes.xs,
  },
  currentText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.freshness.current.text,
  },
  staleContainer: {
    flexDirection: 'column',
    gap: Spacing.xs,
    padding: Spacing.md,
    backgroundColor: Colors.freshness.stale.bg,
    borderWidth: 1.5,
    borderColor: Colors.freshness.stale.border,
    borderRadius: Spacing.borderRadius.md,
    marginVertical: Spacing.sm,
  },
  staleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  staleIcon: {
    fontSize: 18,
    color: Colors.freshness.stale.icon,
  },
  staleTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.freshness.stale.text,
  },
  staleSubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
  },
  staleBody: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  unknownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.freshness.unknown.bg,
    borderWidth: 1,
    borderColor: Colors.freshness.unknown.border,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Spacing.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  unknownIcon: {
    color: Colors.freshness.unknown.text,
    fontSize: Typography.fontSizes.xs,
  },
  unknownText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.freshness.unknown.text,
  },
});

export default StaleDataWarning;
