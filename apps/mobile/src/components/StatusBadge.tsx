// Semantic Status Badge (Text + Explicit Icon, Never Color Only)
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';

export type StatusVariant =
  | 'available'
  | 'lowStock'
  | 'outOfStock'
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'timedOut'
  | 'neutral';

export interface StatusBadgeProps {
  label: string;
  variant: StatusVariant;
  customIcon?: string;
  testID?: string;
  style?: React.CSSProperties;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant,
  customIcon,
  testID,
  style,
}) => {
  const getBadgeStyles = () => {
    switch (variant) {
      case 'available':
      case 'confirmed':
        return {
          bg: Colors.status.available.bg,
          text: Colors.status.available.text,
          border: Colors.status.available.border,
          defaultIcon: '✓',
        };
      case 'lowStock':
      case 'pending':
        return {
          bg: Colors.status.pending.bg,
          text: Colors.status.pending.text,
          border: Colors.status.pending.border,
          defaultIcon: '!',
        };
      case 'outOfStock':
      case 'rejected':
        return {
          bg: Colors.status.outOfStock.bg,
          text: Colors.status.outOfStock.text,
          border: Colors.status.outOfStock.border,
          defaultIcon: '✕',
        };
      case 'timedOut':
        return {
          bg: Colors.status.timedOut.bg,
          text: Colors.status.timedOut.text,
          border: Colors.status.timedOut.border,
          defaultIcon: '⏱',
        };
      case 'neutral':
      default:
        return {
          bg: Colors.surfaceSubtle,
          text: Colors.textSecondary,
          border: Colors.border,
          defaultIcon: '•',
        };
    }
  };

  const badge = getBadgeStyles();
  const icon = customIcon || badge.defaultIcon;

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingLeft: Spacing.sm,
    paddingRight: Spacing.sm,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
    backgroundColor: badge.bg,
    color: badge.text,
    border: `1px solid ${badge.border}`,
    borderRadius: Spacing.borderRadius.full,
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
    width: 'fit-content',
    ...style,
  };

  return (
    <span style={badgeStyle} data-testid={testID} role="status">
      <span aria-hidden="true" style={{ fontWeight: 'bold' }}>
        {icon}
      </span>
      <span>{label}</span>
    </span>
  );
};

export default StatusBadge;
