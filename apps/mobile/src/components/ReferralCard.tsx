// Patient Referral Card Component — React Native
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
import { Referral, ReferralStatus } from '../types';
import { StatusBadge } from './StatusBadge';

export interface ReferralCardProps {
  referral: Referral;
  onApprove?: () => void;
  onReject?: () => void;
  onPress?: () => void;
  showDoctorActions?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export const ReferralCard: React.FC<ReferralCardProps> = ({
  referral,
  onApprove,
  onReject,
  onPress,
  showDoctorActions = false,
  testID,
  style,
}) => {
  const getStatusVariant = (status: ReferralStatus) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return 'confirmed';
      case 'PENDING_DOCTOR_APPROVAL':
        return 'pending';
      case 'TIMED_OUT':
        return 'timedOut';
      case 'REJECTED':
      case 'CANCELLED':
      default:
        return 'rejected';
    }
  };

  const getStatusLabel = (status: ReferralStatus) => {
    switch (status) {
      case 'PENDING_DOCTOR_APPROVAL':
        return 'Pending Approval';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      case 'TIMED_OUT':
        return 'Timed Out (30m)';
      case 'CANCELLED':
        return 'Cancelled';
      case 'COMPLETED':
        return 'Completed';
      default:
        return status;
    }
  };

  const isPending = referral.status === 'PENDING_DOCTOR_APPROVAL';
  const isEmergency = referral.urgency === 'EMERGENCY';
  const ContainerComponent = onPress ? TouchableOpacity : View;

  return (
    <ContainerComponent
      data-testid={testID}
      testID={testID}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole={onPress ? 'button' : undefined}
      style={[
        styles.container,
        {
          borderColor: isEmergency
            ? Colors.emergency.border
            : Colors.border,
        },
        style,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>
            {referral.patient?.name || 'Patient Referral'}
          </Text>
          <Text style={styles.facilities}>
            {referral.fromFacility?.name || 'Referring PHC'} ➔ {referral.toFacility?.name || 'Receiving Facility'}
          </Text>
        </View>
        <StatusBadge
          label={getStatusLabel(referral.status)}
          variant={getStatusVariant(referral.status)}
        />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          Urgency:{' '}
          <Text
            style={[
              styles.urgencyText,
              {
                color: isEmergency
                  ? Colors.emergency.surface
                  : Colors.textPrimary,
              },
            ]}
          >
            {referral.urgency}
          </Text>
        </Text>
        {referral.receivingDoctor && (
          <Text style={styles.metaText}>
            Doctor: Dr. {referral.receivingDoctor.specialization}
          </Text>
        )}
      </View>

      {referral.clinicalNotes && (
        <Text style={styles.clinicalNotes}>
          "{referral.clinicalNotes}"
        </Text>
      )}

      {referral.status === 'TIMED_OUT' && (
        <View style={styles.timedOutBox}>
          <Text style={styles.timedOutText}>
            ⏱ 30-minute doctor response window elapsed. Please reassign or select alternative facility.
          </Text>
        </View>
      )}

      {showDoctorActions && isPending && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={onApprove}
            style={styles.approveButton}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.approveButtonText}>✓ Approve Referral</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onReject}
            style={styles.rejectButton}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.rejectButtonText}>✕ Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </ContainerComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
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
  facilities: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginVertical: Spacing.xs,
  },
  metaText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },
  urgencyText: {
    fontWeight: Typography.fontWeights.bold,
  },
  clinicalNotes: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginVertical: Spacing.xs,
    fontStyle: 'italic',
  },
  timedOutBox: {
    padding: Spacing.xs,
    backgroundColor: Colors.status.timedOut.bg,
    borderRadius: Spacing.borderRadius.sm,
    marginTop: Spacing.xs,
  },
  timedOutText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.status.timedOut.text,
    fontWeight: Typography.fontWeights.medium,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  approveButton: {
    flex: 1,
    minHeight: Spacing.minTouchTarget,
    backgroundColor: Colors.primary,
    borderRadius: Spacing.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButtonText: {
    color: Colors.textInverse,
    fontWeight: Typography.fontWeights.semibold,
    fontSize: Typography.fontSizes.sm,
  },
  rejectButton: {
    flex: 1,
    minHeight: Spacing.minTouchTarget,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.status.rejected.border,
    borderRadius: Spacing.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButtonText: {
    color: Colors.status.rejected.text,
    fontWeight: Typography.fontWeights.semibold,
    fontSize: Typography.fontSizes.sm,
  },
});

export default ReferralCard;
