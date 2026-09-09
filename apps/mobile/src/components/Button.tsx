// Accessible, High-Contrast Button Primitive — React Native
import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
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
  const isDisabled = disabled || isLoading;

  const getBackgroundColor = (): string => {
    if (isDisabled) return Colors.border;
    switch (variant) {
      case 'primary': return Colors.primary;
      case 'secondary': return Colors.secondary;
      case 'danger': return Colors.emergency.surface;
      case 'outline': return 'transparent';
      default: return Colors.primary;
    }
  };

  const getTextColor = (): string => {
    if (isDisabled) return Colors.textMuted;
    if (variant === 'outline') return Colors.primary;
    return Colors.textInverse;
  };

  const getBorderWidth = (): number => variant === 'outline' ? 2 : 0;
  const getBorderColor = (): string =>
    variant === 'outline' ? (isDisabled ? Colors.border : Colors.primary) : 'transparent';

  return (
    <TouchableOpacity
      testID={testID}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderWidth: getBorderWidth(),
          borderColor: getBorderColor(),
          opacity: isDisabled ? 0.7 : 1,
        },
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
          accessibilityLabel="Loading"
        />
      ) : (
        <Text
          style={[styles.text, { color: getTextColor() }]}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Spacing.minTouchTarget, // 48px minimum touch target
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.borderRadius.md,
    width: '100%',
  },
  text: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semibold,
    textAlign: 'center',
  },
});

export default Button;
