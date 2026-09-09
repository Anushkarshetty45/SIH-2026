// Understandable Localized Error Display — React Native
import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography } from '../theme';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  isNetworkError?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
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
  return (
    <View
      testID={testID}
      accessibilityRole="alert"
      style={[styles.container, style]}
    >
      <Text style={styles.icon} accessibilityElementsHidden>
        {isNetworkError ? '📡' : '⚠️'}
      </Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <View style={styles.retryWrapper}>
          <Button title={retryLabel} onPress={onRetry} variant="primary" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.status.rejected.bg,
    borderWidth: 1,
    borderColor: Colors.status.rejected.border,
    borderRadius: Spacing.borderRadius.lg,
    margin: Spacing.md,
  },
  icon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.status.rejected.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  retryWrapper: {
    width: '100%',
    maxWidth: 180,
    marginTop: Spacing.lg,
  },
});

export default ErrorState;
