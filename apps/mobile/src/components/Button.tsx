// Accessible, High-Contrast Button Primitive
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  style?: React.CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  testID,
  accessibilityLabel,
  style,
}) => {
  const getBackgroundColor = () => {
    if (disabled || isLoading) return Colors.border;
    switch (variant) {
      case 'primary':
        return Colors.primary;
      case 'secondary':
        return Colors.secondary;
      case 'danger':
        return Colors.emergency.surface;
      case 'outline':
        return 'transparent';
      default:
        return Colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled || isLoading) return Colors.textMuted;
    if (variant === 'outline') return Colors.primary;
    return Colors.textInverse;
  };

  const getBorder = () => {
    if (variant === 'outline') {
      return `2px solid ${disabled || isLoading ? Colors.border : Colors.primary}`;
    }
    return 'none';
  };

  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Spacing.minTouchTarget, // 48px minimum touch target for accessibility
    paddingLeft: Spacing.xl,
    paddingRight: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: getBackgroundColor(),
    color: getTextColor(),
    border: getBorder(),
    borderRadius: Spacing.borderRadius.md,
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semibold,
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.7 : 1,
    boxSizing: 'border-box',
    width: '100%',
    textAlign: 'center',
    userSelect: 'none',
    ...style,
  };

  return (
    <button
      type="button"
      data-testid={testID}
      aria-label={accessibilityLabel || title}
      disabled={disabled || isLoading}
      onClick={onPress}
      style={buttonStyle}
    >
      {isLoading ? '...' : title}
    </button>
  );
};

export default Button;
