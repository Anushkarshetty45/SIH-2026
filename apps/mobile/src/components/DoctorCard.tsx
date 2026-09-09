// Doctor Information Card Component
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';
import { Doctor } from '../types';
import { StatusBadge } from './StatusBadge';

export interface DoctorCardProps {
  doctor: Doctor;
  onSelectSlot?: () => void;
  testID?: string;
  style?: React.CSSProperties;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onSelectSlot,
  testID,
  style,
}) => {
  const containerStyle: React.CSSProperties = {
    backgroundColor: Colors.surface,
    border: `1px solid ${Colors.border}`,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...style,
  };

  return (
    <div style={containerStyle} data-testid={testID}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xs }}>
        <h3 style={{ fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary, margin: 0 }}>
          {doctor.name || `Dr. ${doctor.specialization}`}
        </h3>
        <StatusBadge
          label={doctor.isAvailable ? 'Available' : 'Unavailable'}
          variant={doctor.isAvailable ? 'available' : 'outOfStock'}
        />
      </div>
      <p style={{ fontSize: Typography.fontSizes.sm, color: Colors.primary, fontWeight: Typography.fontWeights.medium, margin: `${Spacing.xs}px 0` }}>
        🩺 {doctor.specialization}
      </p>
      <p style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted, margin: 0 }}>
        Reg No: {doctor.registrationNo} • {doctor.facilityName || 'Linked Facility'}
      </p>

      {onSelectSlot && (
        <button
          type="button"
          onClick={onSelectSlot}
          disabled={!doctor.isAvailable}
          style={{
            marginTop: Spacing.md,
            width: '100%',
            minHeight: Spacing.minTouchTarget,
            backgroundColor: doctor.isAvailable ? Colors.primary : Colors.border,
            color: Colors.textInverse,
            border: 'none',
            borderRadius: Spacing.borderRadius.md,
            fontSize: Typography.fontSizes.sm,
            fontWeight: Typography.fontWeights.semibold,
            cursor: doctor.isAvailable ? 'pointer' : 'not-allowed',
          }}
        >
          Select Appointment Slot
        </button>
      )}
    </div>
  );
};

export default DoctorCard;
