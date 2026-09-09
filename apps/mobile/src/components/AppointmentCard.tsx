// Patient Appointment Card Component — React Native
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme';
import { Appointment, AppointmentStatus } from '../types';
import { StatusBadge } from './StatusBadge';

export interface AppointmentCardProps {
  appointment: Appointment;
  onCancel?: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
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
    <View
      testID={testID}
      style={[styles.container, style]}
    >
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>
            👤 {appointment.patient?.name || 'Patient'}
          </Text>
          <Text style={styles.subtitle}>
            Dr. {appointment.doctor?.specialization || 'Doctor'} • {appointment.facility?.name || 'Facility'}
          </Text>
        </View>
        <StatusBadge label={appointment.status} variant={getStatusVariant(appointment.status)} />
      </View>

      <View style={styles.slotBox}>
        <Text style={styles.slotText}>
          📅 {appointment.slot?.date ? String(appointment.slot.date).slice(0, 10) : 'Scheduled Date'} • ⏰ {appointment.slot?.startTime || 'Time Slot'}
        </Text>
      </View>

      {appointment.notes && (
        <Text style={styles.notes}>
          Notes: {appointment.notes}
        </Text>
      )}

      {onCancel && appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
        <TouchableOpacity
          onPress={onCancel}
          style={styles.cancelButton}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <Text style={styles.cancelButtonText}>
            Cancel Appointment
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  headerTextContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  slotBox: {
    marginVertical: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Spacing.borderRadius.md,
  },
  slotText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.primary,
  },
  notes: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    marginVertical: Spacing.xs,
  },
  cancelButton: {
    marginTop: Spacing.sm,
    width: '100%',
    minHeight: Spacing.minTouchTarget,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.status.rejected.border,
    borderRadius: Spacing.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: Colors.status.rejected.text,
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
  },
});

export default AppointmentCard;
