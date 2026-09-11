// Cached Data Indicator Badge (Explicitly signals offline local cache vs live server data) — React Native
import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography } from '../theme';

export interface CachedDataBadgeProps {
  isCached: boolean;
  cacheAgeText?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export const CachedDataBadge: React.FC<CachedDataBadgeProps> = ({
  isCached,
  cacheAgeText,
  testID,
  style,
}) => {
  if (!isCached) return null;

  return (
    <View
      testID={testID}
      accessibilityRole="summary"
      style={[styles.container, style]}
    >
      <Text style={styles.icon} accessibilityElementsHidden={true} importantForAccessibility="no">
        💾
      </Text>
      <Text style={styles.text}>
        Cached Data{cacheAgeText ? ` (${cacheAgeText})` : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.status.lowStock.bg,
    borderWidth: 1,
    borderColor: Colors.status.lowStock.border,
    borderRadius: Spacing.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  icon: {
    fontSize: Typography.fontSizes.xs,
  },
  text: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.status.lowStock.text,
  },
});

export default CachedDataBadge;
