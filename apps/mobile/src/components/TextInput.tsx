// Labeled, Accessible TextInput Primitive — React Native
import React from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  StyleProp,
  ViewStyle,
  KeyboardTypeOptions,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme';

export interface TextInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  secureTextEntry?: boolean;
  disabled?: boolean;
  keyboardType?: 'text' | 'numeric' | 'email' | 'tel' | KeyboardTypeOptions;
  testID?: string;
  required?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: StyleProp<ViewStyle>;
}

const mapKeyboardType = (type?: string): KeyboardTypeOptions => {
  switch (type) {
    case 'numeric': return 'numeric';
    case 'email':
    case 'email-address': return 'email-address';
    case 'tel': return 'phone-pad';
    case 'phone-pad': return 'phone-pad';
    case 'decimal-pad': return 'decimal-pad';
    default: return 'default';
  }
};

export const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  secureTextEntry = false,
  disabled = false,
  keyboardType = 'text',
  testID,
  required = false,
  multiline = false,
  numberOfLines = 1,
  autoCapitalize = 'none',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <RNTextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        secureTextEntry={secureTextEntry}
        editable={!disabled}
        keyboardType={mapKeyboardType(keyboardType)}
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[
          styles.input,
          multiline && styles.multilineInput,
          {
            backgroundColor: disabled ? Colors.surfaceSubtle : Colors.surface,
            borderColor: error ? Colors.emergency.border : Colors.border,
          },
        ]}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      {!error && helperText && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    marginBottom: Spacing.md,
    width: '100%',
  },
  label: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  required: {
    color: Colors.emergency.surface,
  },
  input: {
    minHeight: Spacing.minTouchTarget, // 48px touch target
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSizes.md,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderRadius: Spacing.borderRadius.md,
    width: '100%',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.emergency.surface,
    marginTop: Spacing.xs,
    fontWeight: Typography.fontWeights.medium,
  },
  helperText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});

export default TextInput;
