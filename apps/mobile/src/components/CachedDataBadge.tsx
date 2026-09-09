// Cached Data Indicator Badge (Explicitly signals offline local cache vs live server data)
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';

export interface CachedDataBadgeProps {
  isCached: boolean;
  cacheAgeText?: string;
  testID?: string;
  style?: React.CSSProperties;
}

export const CachedDataBadge: React.FC<CachedDataBadgeProps> = ({
  isCached,
  cacheAgeText,
  testID,
  style,
}) => {
  if (!isCached) return null;

  return (
    <div
      data-testid={testID}
      role="status"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: Spacing.xs,
        padding: `${Spacing.xs}px ${Spacing.sm}px`,
        backgroundColor: Colors.status.lowStock.bg,
        border: `1px solid ${Colors.status.lowStock.border}`,
        borderRadius: Spacing.borderRadius.sm,
        fontSize: Typography.fontSizes.xs,
        fontWeight: Typography.fontWeights.medium,
        color: Colors.status.lowStock.text,
        ...style,
      }}
    >
      <span aria-hidden="true">💾</span>
      <span>Cached Data{cacheAgeText ? ` (${cacheAgeText})` : ''}</span>
    </div>
  );
};

export default CachedDataBadge;
