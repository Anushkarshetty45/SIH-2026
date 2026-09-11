// Desktop Loading, Empty, and Error State Components
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';
import { Button } from './Button';

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading data...' }) => (
  <div
    style={{
      padding: Spacing.xl,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: Colors.textSecondary,
      gap: Spacing.sm,
    }}
  >
    <span style={{ fontSize: '28px' }}>⏳</span>
    <span style={{ fontSize: Typography.fontSizes.sm }}>{message}</span>
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, onAction }) => (
  <div
    style={{
      padding: Spacing.xl,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.surface,
      borderRadius: Spacing.borderRadius.lg,
      border: `1px solid ${Colors.border}`,
      color: Colors.textSecondary,
      gap: Spacing.xs,
      textAlign: 'center',
    }}
  >
    <span style={{ fontSize: '32px' }}>📭</span>
    <h3 style={{ margin: 0, fontSize: Typography.fontSizes.md, color: Colors.textPrimary }}>
      {title}
    </h3>
    {description && (
      <p style={{ margin: 0, fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>
        {description}
      </p>
    )}
    {actionLabel && onAction && (
      <div style={{ marginTop: Spacing.md }}>
        <Button title={actionLabel} onPress={onAction} variant="outline" size="sm" />
      </div>
    )}
  </div>
);

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
}> = ({ title = 'Failed to Load Data', message, onRetry }) => (
  <div
    style={{
      padding: Spacing.lg,
      backgroundColor: Colors.status.outOfStock.bg,
      borderRadius: Spacing.borderRadius.lg,
      border: `1px solid ${Colors.status.outOfStock.border}`,
      color: Colors.status.outOfStock.text,
      display: 'flex',
      flexDirection: 'column',
      gap: Spacing.sm,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
      <span style={{ fontSize: '20px' }}>⚠️</span>
      <strong>{title}</strong>
    </div>
    <span style={{ fontSize: Typography.fontSizes.sm }}>{message}</span>
    {onRetry && (
      <div>
        <Button title="Retry" onPress={onRetry} variant="danger" size="sm" />
      </div>
    )}
  </div>
);
