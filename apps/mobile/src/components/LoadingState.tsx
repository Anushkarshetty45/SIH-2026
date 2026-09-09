// Lightweight Loading Indicator Primitive (2G Friendly)
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';

export interface LoadingStateProps {
  message?: string;
  testID?: string;
  style?: React.CSSProperties;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  testID,
  style,
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    minHeight: 120,
    width: '100%',
    ...style,
  };

  const spinnerStyle: React.CSSProperties = {
    width: 28,
    height: 28,
    border: `3px solid ${Colors.borderLight}`,
    borderTop: `3px solid ${Colors.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: Spacing.md,
  };

  const textStyle: React.CSSProperties = {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeights.medium,
  };

  return (
    <div style={containerStyle} data-testid={testID} role="progressbar">
      <div style={spinnerStyle} />
      <span style={textStyle}>{message}</span>
    </div>
  );
};

export default LoadingState;
