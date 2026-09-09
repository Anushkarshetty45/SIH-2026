// Patient Appointment Card Component
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';
import { Appointment, AppointmentStatus } from '../types';
import { StatusBadge } from './StatusBadge';

export interface AppointmentCardProps {
  appointment: Appointment;
  onCancel?: () => void;
  testID?: string;
  style?: React.CSSProperties;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onCancel,
  testID,
  style,
}) => {
  const getStatusVariant = (status: AppointmentStatus) => {
    switch (status) {
      case 'CONFIRMED':
      case 'COMPLETED':
        return 'confirmed';
      case 'SCHEDULED':
        return 'pending';
      case 'CANCELLED':
      case 'NO_SHOW':
      default:
        return 'rejected';
    }
  };

  return (
    <div
      data-testid={testID}
      style={{
        backgroundColor: Colors.surface,
        border: `1px solid ${Colors.border}`,
        borderRadius: Spacing.borderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        ...style,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xs }}>
        <div>
          <h4 style={{ margin: 0, fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary }}>
            👤 {appointment.patient?.name || 'Patient'}
          </h4>
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
            Dr. {appointment.doctor?.specialization || 'Doctor'} • {appointment.facility?.name || 'Facility'}
          </span>
        </div>
        <StatusBadge label={appointment.status} variant={getStatusVariant(appointment.status)} />
      </div>

      <div style={{ margin: `${Spacing.sm}px 0`, padding: Spacing.sm, backgroundColor: Colors.surfaceSubtle, borderRadius: Spacing.borderRadius.md }}>
        <div style={{ fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.semibold, color: Colors.primary }}>
          📅 {appointment.slot?.date ? String(appointment.slot.date).slice(0, 10) : 'Scheduled Date'} • ⏰ {appointment.slot?.startTime || 'Time Slot'}
        </div>
      </div>

      {appointment.notes && (
        <p style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted, margin: `${Spacing.xs}px 0` }}>
          Notes: {appointment.notes}
        </p>
      )}

      {onCancel && appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
        <button
          type="button"
          onClick={onCancel}
          style={{
            marginTop: Spacing.sm,
            width: '100%',
            minHeight: Spacing.minTouchTarget,
            backgroundColor: 'transparent',
            color: Colors.status.rejected.text,
            border: `1px solid ${Colors.status.rejected.border}`,
            borderRadius: Spacing.borderRadius.md,
            fontSize: Typography.fontSizes.xs,
            fontWeight: Typography.fontWeights.semibold,
            cursor: 'pointer',
          }}
        >
          Cancel Appointment
        </button>
      )}
    </div>
  );
};

export default AppointmentCard;
