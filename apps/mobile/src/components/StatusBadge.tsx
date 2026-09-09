// Semantic Status Badge — React Native (Text + Explicit Icon, Never Color Only)
import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
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
  style?: StyleProp<ViewStyle>;
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
        return { bg: Colors.status.available.bg, text: Colors.status.available.text, border: Colors.status.available.border, defaultIcon: '✓' };
      case 'lowStock':
      case 'pending':
        return { bg: Colors.status.pending.bg, text: Colors.status.pending.text, border: Colors.status.pending.border, defaultIcon: '!' };
      case 'outOfStock':
      case 'rejected':
        return { bg: Colors.status.outOfStock.bg, text: Colors.status.outOfStock.text, border: Colors.status.outOfStock.border, defaultIcon: '✕' };
      case 'timedOut':
        return { bg: Colors.status.timedOut.bg, text: Colors.status.timedOut.text, border: Colors.status.timedOut.border, defaultIcon: '⏱' };
      case 'neutral':
      default:
        return { bg: Colors.surfaceSubtle, text: Colors.textSecondary, border: Colors.border, defaultIcon: '•' };
    }
  };

  const badge = getBadgeStyles();
  const icon = customIcon || badge.defaultIcon;

  return (
    <View
      testID={testID}
      accessibilityRole="summary"
      style={[
        styles.badge,
        { backgroundColor: badge.bg, borderColor: badge.border },
        style,
      ]}
    >
      <Text style={[styles.icon, { color: badge.text }]} accessibilityElementsHidden>
        {icon}
      </Text>
      <Text style={[styles.label, { color: badge.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
    marginRight: Spacing.xs,
  },
  label: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
  },
});

export default StatusBadge;
