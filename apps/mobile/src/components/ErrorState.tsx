// Understandable Localized Error Display
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  isNetworkError?: boolean;
  testID?: string;
  style?: React.CSSProperties;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Error',
  message,
  onRetry,
  retryLabel = 'Retry',
  isNetworkError = false,
  testID,
  style,
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.emergency.background + '15', // light reddish tint
    border: `1px solid ${Colors.status.rejected.border}`,
    borderRadius: Spacing.borderRadius.lg,
    margin: Spacing.md,
    textAlign: 'center',
    boxSizing: 'border-box',
    ...style,
  };

  const iconStyle: React.CSSProperties = {
    fontSize: 32,
    marginBottom: Spacing.xs,
    color: Colors.emergency.surface,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.status.rejected.text,
    marginBottom: Spacing.xs,
  };

  const messageStyle: React.CSSProperties = {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: onRetry ? Spacing.lg : 0,
    maxWidth: 320,
  };

  return (
    <div style={containerStyle} data-testid={testID} role="alert">
      <span style={iconStyle} aria-hidden="true">
        {isNetworkError ? '📡' : '⚠️'}
      </span>
      <h4 style={titleStyle}>{title}</h4>
      <p style={messageStyle}>{message}</p>
      {onRetry && (
        <div style={{ width: '100%', maxWidth: 180 }}>
          <Button title={retryLabel} onPress={onRetry} variant="primary" />
        </div>
      )}
    </div>
  );
};

export default ErrorState;
