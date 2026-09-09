// Critical CareGrid Freshness & Stale Data Warning Component
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';
import { FreshnessStatus } from '../types';

export interface StaleDataWarningProps {
  lastUpdatedAt: string | Date;
  staleThresholdMinutes?: number; // Default 120 minutes (2 hours per SRS)
  isEmergencyMode?: boolean;
  resourceName?: string;
  testID?: string;
  style?: React.CSSProperties;
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
      <div
        data-testid={testID}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: Spacing.xs,
          fontSize: Typography.fontSizes.xs,
          color: Colors.freshness.current.text,
          backgroundColor: Colors.freshness.current.bg,
          border: `1px solid ${Colors.freshness.current.border}`,
          padding: `${Spacing.xs}px ${Spacing.sm}px`,
          borderRadius: Spacing.borderRadius.sm,
          ...style,
        }}
      >
        <span aria-hidden="true">✓</span>
        <span>Current • Updated {displayText}</span>
      </div>
    );
  }

  if (status === 'STALE') {
    return (
      <div
        data-testid={testID}
        role="alert"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: Spacing.xs,
          padding: Spacing.md,
          backgroundColor: Colors.freshness.stale.bg,
          border: `1.5px solid ${Colors.freshness.stale.border}`,
          borderRadius: Spacing.borderRadius.md,
          margin: `${Spacing.sm}px 0`,
          ...style,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
          <span style={{ fontSize: 18, color: Colors.freshness.stale.icon }} aria-hidden="true">
            ⚠️
          </span>
          <span
            style={{
              fontSize: Typography.fontSizes.sm,
              fontWeight: Typography.fontWeights.bold,
              color: Colors.freshness.stale.text,
            }}
          >
            STALE DATA WARNING
          </span>
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
            (Updated {displayText})
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: Typography.fontSizes.xs,
            color: Colors.textPrimary,
            lineHeight: Typography.lineHeights.normal,
          }}
        >
          {isEmergencyMode
            ? `EMERGENCY ALERT: ${resourceName} was last updated ${displayText}. Place a direct voice call to confirm availability before patient dispatch.`
            : `Notice: Bed and facility ${resourceName} was last updated ${displayText}. Status may have changed.`}
        </p>
      </div>
    );
  }

  // UNKNOWN Status
  return (
    <div
      data-testid={testID}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: Spacing.xs,
        fontSize: Typography.fontSizes.xs,
        color: Colors.freshness.unknown.text,
        backgroundColor: Colors.freshness.unknown.bg,
        border: `1px solid ${Colors.freshness.unknown.border}`,
        padding: `${Spacing.xs}px ${Spacing.sm}px`,
        borderRadius: Spacing.borderRadius.sm,
        ...style,
      }}
    >
      <span aria-hidden="true">•</span>
      <span>Status Unknown • No recent updates</span>
    </div>
  );
};

export default StaleDataWarning;
