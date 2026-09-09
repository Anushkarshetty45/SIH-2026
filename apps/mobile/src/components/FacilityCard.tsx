// Facility Overview Card Component
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';
import { Facility, FacilityType } from '../types';
import { StaleDataWarning } from './StaleDataWarning';

export interface FacilityCardProps {
  facility: Facility;
  availableBeds?: number;
  totalBeds?: number;
  onPress?: () => void;
  testID?: string;
  style?: React.CSSProperties;
}

export const FacilityCard: React.FC<FacilityCardProps> = ({
  facility,
  availableBeds,
  totalBeds,
  onPress,
  testID,
  style,
}) => {
  const containerStyle: React.CSSProperties = {
    backgroundColor: Colors.surface,
    border: `1px solid ${Colors.border}`,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    cursor: onPress ? 'pointer' : 'default',
    ...style,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  };

  const nameStyle: React.CSSProperties = {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    margin: 0,
  };

  const typeBadgeStyle: React.CSSProperties = {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.primary,
    backgroundColor: Colors.primarySurface,
    padding: `${Spacing.xs}px ${Spacing.sm}px`,
    borderRadius: Spacing.borderRadius.sm,
  };

  const metaStyle: React.CSSProperties = {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  };

  return (
    <div style={containerStyle} onClick={onPress} data-testid={testID}>
      <div style={headerStyle}>
        <h3 style={nameStyle}>{facility.name}</h3>
        <span style={typeBadgeStyle}>{facility.type}</span>
      </div>
      <p style={metaStyle}>
        📍 {facility.district}, {facility.state}
      </p>

      {totalBeds !== undefined && (
        <div style={{ marginBottom: Spacing.sm, fontSize: Typography.fontSizes.sm }}>
          <strong>Beds:</strong>{' '}
          <span style={{ color: (availableBeds || 0) > 0 ? Colors.status.available.text : Colors.status.outOfStock.text }}>
            {availableBeds ?? 0} / {totalBeds} Available
          </span>
        </div>
      )}

      <StaleDataWarning lastUpdatedAt={facility.lastUpdatedAt} />
    </div>
  );
};

export default FacilityCard;
