// Lightweight Loading Indicator Primitive — React Native (2G Friendly)
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography } from '../theme';

export interface LoadingStateProps {
  message?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  testID,
  style,
}) => {
  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      style={[styles.container, style]}
    >
      <ActivityIndicator
        size="small"
        color={Colors.primary}
        style={styles.spinner}
      />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    minHeight: 120,
    width: '100%',
  },
  spinner: {
    marginBottom: Spacing.md,
  },
  text: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeights.medium,
  },
});

export default LoadingState;
