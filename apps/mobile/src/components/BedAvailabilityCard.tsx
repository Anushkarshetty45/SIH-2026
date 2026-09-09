// Bed Category Availability Card Component
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';
import { BedCategory, FreshnessStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { StaleDataWarning } from './StaleDataWarning';

export interface BedAvailabilityCardProps {
  category: BedCategory;
  availableCount: number;
  totalCount: number;
  lastUpdatedAt: string;
  facilityName?: string;
  isEmergencyContext?: boolean;
  testID?: string;
  style?: React.CSSProperties;
}

export const BedAvailabilityCard: React.FC<BedAvailabilityCardProps> = ({
  category,
  availableCount,
  totalCount,
  lastUpdatedAt,
  facilityName,
  isEmergencyContext = false,
  testID,
  style,
}) => {
  const isAvailable = availableCount > 0;

  return (
    <div
      data-testid={testID}
      style={{
        backgroundColor: Colors.surface,
        border: `1px solid ${Colors.border}`,
        borderRadius: Spacing.borderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        ...style,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs }}>
        <div>
          <h4 style={{ margin: 0, fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary }}>
            {category} Ward
          </h4>
          {facilityName && (
            <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
              {facilityName}
            </span>
          )}
        </div>
        <StatusBadge
          label={isAvailable ? `${availableCount} Available` : 'Full / 0 Available'}
          variant={isAvailable ? 'available' : 'outOfStock'}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xs, marginBottom: Spacing.xs }}>
        <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>
          Capacity: {totalCount - availableCount} Occupied / {totalCount} Total
        </span>
      </div>

      <StaleDataWarning
        lastUpdatedAt={lastUpdatedAt}
        resourceName={`${category} beds`}
        isEmergencyMode={isEmergencyContext}
      />
    </div>
  );
};

export default BedAvailabilityCard;
