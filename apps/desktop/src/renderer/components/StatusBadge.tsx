// Desktop Status Badge Component
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';

export type StatusType =
  | 'available'
  | 'occupied'
  | 'lowStock'
  | 'outOfStock'
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'timedOut';

export interface StatusBadgeProps {
  label: string;
  status: StatusType;
  testID?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, status, testID }) => {
  const getStyles = () => {
    switch (status) {
      case 'available':
      case 'confirmed':
        return Colors.status.available;
      case 'lowStock':
      case 'pending':
        return Colors.status.lowStock;
      case 'occupied':
      case 'outOfStock':
      case 'rejected':
        return Colors.status.outOfStock;
      case 'timedOut':
        return Colors.status.timedOut;
      default:
        return Colors.status.pending;
    }
  };

  const styleConfig = getStyles();

  return (
    <span
      data-testid={testID}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: `2px ${Spacing.sm}px`,
        backgroundColor: styleConfig.bg,
        color: styleConfig.text,
        border: `1px solid ${styleConfig.border}`,
        borderRadius: Spacing.borderRadius.full,
        fontSize: Typography.fontSizes.xs,
        fontWeight: Typography.fontWeights.semibold,
      }}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
