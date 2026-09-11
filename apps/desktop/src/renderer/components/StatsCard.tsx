// Desktop Metric/KPI Card
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';

export interface StatsCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: string;
  badge?: string;
  badgeColor?: string;
  testID?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtext,
  icon,
  badge,
  badgeColor,
  testID,
}) => {
  return (
    <div
      data-testid={testID}
      style={{
        backgroundColor: Colors.surface,
        border: `1px solid ${Colors.border}`,
        borderRadius: Spacing.borderRadius.lg,
        padding: Spacing.lg,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minWidth: 200,
        flex: 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
        <span style={{ fontSize: Typography.fontSizes.sm, color: Colors.textSecondary, fontWeight: Typography.fontWeights.medium }}>
          {title}
        </span>
        {icon && <span style={{ fontSize: '20px' }}>{icon}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: Spacing.sm }}>
        <span style={{ fontSize: Typography.fontSizes.xxl, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary }}>
          {value}
        </span>
        {badge && (
          <span
            style={{
              fontSize: Typography.fontSizes.xs,
              padding: `2px ${Spacing.xs}px`,
              borderRadius: Spacing.borderRadius.sm,
              backgroundColor: badgeColor || Colors.surfaceSubtle,
              color: Colors.textPrimary,
              fontWeight: Typography.fontWeights.semibold,
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {subtext && (
        <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted, marginTop: Spacing.xs }}>
          {subtext}
        </span>
      )}
    </div>
  );
};

export default StatsCard;
