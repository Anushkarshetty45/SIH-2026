// Desktop Stale Data Alert Banner
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';
import { t } from '../i18n';

export interface StaleDataBannerProps {
  lastUpdatedAt: string;
  staleMinutes?: number;
  testID?: string;
}

export const StaleDataBanner: React.FC<StaleDataBannerProps> = ({
  lastUpdatedAt,
  staleMinutes = 120,
  testID,
}) => {
  const diffMs = Date.now() - new Date(lastUpdatedAt).getTime();
  const diffMin = Math.floor(diffMs / (60 * 1000));
  const isStale = isNaN(diffMin) || diffMin >= staleMinutes;

  if (!isStale) return null;

  return (
    <div
      data-testid={testID}
      role="alert"
      style={{
        backgroundColor: Colors.freshness.stale.bg,
        border: `1.5px solid ${Colors.freshness.stale.border}`,
        borderRadius: Spacing.borderRadius.md,
        padding: `${Spacing.sm}px ${Spacing.md}px`,
        marginBottom: Spacing.md,
        display: 'flex',
        alignItems: 'center',
        gap: Spacing.sm,
        color: Colors.freshness.stale.text,
        fontSize: Typography.fontSizes.sm,
      }}
    >
      <span style={{ fontSize: '18px' }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <strong style={{ fontWeight: Typography.fontWeights.bold }}>
          {t('staleDataWarning')}
        </strong>
        <span style={{ marginLeft: Spacing.xs, opacity: 0.85, fontSize: Typography.fontSizes.xs }}>
          ({t('lastUpdated')}: {isNaN(diffMin) ? 'Unknown' : `${diffMin} min ago`})
        </span>
      </div>
    </div>
  );
};

export default StaleDataBanner;
