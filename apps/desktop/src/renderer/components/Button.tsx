// Desktop Button Component
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  testID,
}) => {
  const getPadding = () => {
    switch (size) {
      case 'sm':
        return `${Spacing.xs}px ${Spacing.sm}px`;
      case 'lg':
        return `${Spacing.md}px ${Spacing.lg}px`;
      default:
        return `${Spacing.sm}px ${Spacing.md}px`;
    }
  };

  const getBackgroundColor = () => {
    if (disabled || isLoading) return Colors.border;
    switch (variant) {
      case 'primary':
        return Colors.primary;
      case 'secondary':
        return Colors.secondary;
      case 'danger':
        return Colors.status.outOfStock.text;
      case 'outline':
        return 'transparent';
    }
  };

  const getTextColor = () => {
    if (disabled || isLoading) return Colors.textMuted;
    if (variant === 'outline') return Colors.primary;
    return Colors.textInverse;
  };

  return (
    <button
      onClick={onPress}
      disabled={disabled || isLoading}
      data-testid={testID}
      style={{
        padding: getPadding(),
        backgroundColor: getBackgroundColor(),
        color: getTextColor(),
        border: variant === 'outline' ? `1px solid ${Colors.primary}` : 'none',
        borderRadius: Spacing.borderRadius.md,
        fontSize: size === 'sm' ? Typography.fontSizes.xs : Typography.fontSizes.sm,
        fontWeight: Typography.fontWeights.medium,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        transition: 'background 0.15s ease',
      }}
    >
      {isLoading && <span>⏳</span>}
      <span>{title}</span>
    </button>
  );
};

export default Button;
