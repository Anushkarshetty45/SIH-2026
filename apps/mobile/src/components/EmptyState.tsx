// Meaningful Empty State Primitive
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
  testID?: string;
  style?: React.CSSProperties;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon = '📋',
  testID,
  style,
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    textAlign: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Spacing.borderRadius.lg,
    border: `1px dashed ${Colors.border}`,
    margin: Spacing.md,
    boxSizing: 'border-box',
    ...style,
  };

  const iconStyle: React.CSSProperties = {
    fontSize: 40,
    marginBottom: Spacing.sm,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  };

  const descStyle: React.CSSProperties = {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: actionLabel && onAction ? Spacing.lg : 0,
    maxWidth: 320,
  };

  return (
    <div style={containerStyle} data-testid={testID}>
      <span style={iconStyle} aria-hidden="true">
        {icon}
      </span>
      <h4 style={titleStyle}>{title}</h4>
      {description && <p style={descStyle}>{description}</p>}
      {actionLabel && onAction && (
        <div style={{ width: '100%', maxWidth: 200 }}>
          <Button title={actionLabel} onPress={onAction} variant="outline" />
        </div>
      )}
    </div>
  );
};

export default EmptyState;
