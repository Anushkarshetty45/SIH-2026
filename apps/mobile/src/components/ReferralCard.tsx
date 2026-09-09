// Patient Referral Card Component
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';
import { Referral, ReferralStatus, ReferralUrgency } from '../types';
import { StatusBadge } from './StatusBadge';

export interface ReferralCardProps {
  referral: Referral;
  onApprove?: () => void;
  onReject?: () => void;
  onPress?: () => void;
  showDoctorActions?: boolean;
  testID?: string;
  style?: React.CSSProperties;
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

  return (
    <div
      data-testid={testID}
      onClick={onPress}
      style={{
        backgroundColor: Colors.surface,
        border: `1.5px solid ${referral.urgency === 'EMERGENCY' ? Colors.emergency.border : Colors.border}`,
        borderRadius: Spacing.borderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        cursor: onPress ? 'pointer' : 'default',
        ...style,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xs }}>
        <div>
          <h4 style={{ margin: 0, fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary }}>
            {referral.patient?.name || 'Patient Referral'}
          </h4>
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
            {referral.fromFacility?.name || 'Referring PHC'} ➔ {referral.toFacility?.name || 'Receiving Facility'}
          </span>
        </div>
        <StatusBadge
          label={getStatusLabel(referral.status)}
          variant={getStatusVariant(referral.status)}
        />
      </div>

      <div style={{ display: 'flex', gap: Spacing.md, margin: `${Spacing.xs}px 0`, fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>
        <span>Urgency: <strong style={{ color: referral.urgency === 'EMERGENCY' ? Colors.emergency.surface : Colors.textPrimary }}>{referral.urgency}</strong></span>
        {referral.receivingDoctor && <span>Doctor: Dr. {referral.receivingDoctor.specialization}</span>}
      </div>

      {referral.clinicalNotes && (
        <p style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary, margin: `${Spacing.xs}px 0`, fontStyle: 'italic' }}>
          "{referral.clinicalNotes}"
        </p>
      )}

      {referral.status === 'TIMED_OUT' && (
        <div style={{ padding: Spacing.xs, backgroundColor: Colors.status.timedOut.bg, borderRadius: Spacing.borderRadius.sm, marginTop: Spacing.xs }}>
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.status.timedOut.text, fontWeight: Typography.fontWeights.medium }}>
            ⏱ 30-minute doctor response window elapsed. Please reassign or select alternative facility.
          </span>
        </div>
      )}

      {showDoctorActions && isPending && (
        <div style={{ display: 'flex', gap: Spacing.sm, marginTop: Spacing.md }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onApprove) onApprove();
            }}
            style={{
              flex: 1,
              minHeight: Spacing.minTouchTarget,
              backgroundColor: Colors.primary,
              color: Colors.textInverse,
              border: 'none',
              borderRadius: Spacing.borderRadius.md,
              fontWeight: Typography.fontWeights.semibold,
              fontSize: Typography.fontSizes.sm,
              cursor: 'pointer',
            }}
          >
            ✓ Approve Referral
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onReject) onReject();
            }}
            style={{
              flex: 1,
              minHeight: Spacing.minTouchTarget,
              backgroundColor: 'transparent',
              color: Colors.status.rejected.text,
              border: `1.5px solid ${Colors.status.rejected.border}`,
              borderRadius: Spacing.borderRadius.md,
              fontWeight: Typography.fontWeights.semibold,
              fontSize: Typography.fontSizes.sm,
              cursor: 'pointer',
            }}
          >
            ✕ Reject
          </button>
        </div>
      )}
    </div>
  );
};

export default ReferralCard;
