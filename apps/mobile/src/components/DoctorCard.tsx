// Doctor Information Card Component — React Native
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
import { Doctor } from '../types';
import { StatusBadge } from './StatusBadge';

export interface DoctorCardProps {
  doctor: Doctor;
  onSelectSlot?: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onSelectSlot,
  testID,
  style,
}) => {
  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.name}>
          {doctor.name || `Dr. ${doctor.specialization}`}
        </Text>
        <StatusBadge
          label={doctor.isAvailable ? 'Available' : 'Unavailable'}
          variant={doctor.isAvailable ? 'available' : 'outOfStock'}
        />
      </View>
      <Text style={styles.specialization}>
        🩺 {doctor.specialization}
      </Text>
      <Text style={styles.meta}>
        Reg No: {doctor.registrationNo} • {doctor.facilityName || 'Linked Facility'}
      </Text>

      {onSelectSlot && (
        <TouchableOpacity
          onPress={onSelectSlot}
          disabled={!doctor.isAvailable}
          style={[
            styles.slotButton,
            {
              backgroundColor: doctor.isAvailable
                ? Colors.primary
                : Colors.border,
            },
          ]}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <Text style={styles.slotButtonText}>Select Appointment Slot</Text>
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
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  name: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  specialization: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeights.medium,
    marginVertical: Spacing.xs,
  },
  meta: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },
  slotButton: {
    marginTop: Spacing.md,
    width: '100%',
    minHeight: Spacing.minTouchTarget,
    borderRadius: Spacing.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
  },
});

export default DoctorCard;
