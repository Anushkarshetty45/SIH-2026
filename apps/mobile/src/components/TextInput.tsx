// Labeled, Accessible TextInput Primitive
import React from 'react';
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
  keyboardType?: 'text' | 'numeric' | 'email' | 'tel';
  testID?: string;
  required?: boolean;
  style?: React.CSSProperties;
}

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
  style,
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: Spacing.md,
    width: '100%',
    ...style,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  };

  const inputStyle: React.CSSProperties = {
    minHeight: Spacing.minTouchTarget, // 48px touch target
    paddingLeft: Spacing.md,
    paddingRight: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    fontSize: Typography.fontSizes.md,
    color: Colors.textPrimary,
    backgroundColor: disabled ? Colors.surfaceSubtle : Colors.surface,
    border: `1.5px solid ${error ? Colors.emergency.border : Colors.border}`,
    borderRadius: Spacing.borderRadius.md,
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
  };

  const errorStyle: React.CSSProperties = {
    fontSize: Typography.fontSizes.xs,
    color: Colors.emergency.surface,
    marginTop: Spacing.xs,
    fontWeight: Typography.fontWeights.medium,
  };

  const helperStyle: React.CSSProperties = {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  };

  return (
    <div style={containerStyle}>
      {label && (
        <label style={labelStyle}>
          {label} {required && <span style={{ color: Colors.emergency.surface }}>*</span>}
        </label>
      )}
      <input
        type={secureTextEntry ? 'password' : keyboardType === 'numeric' ? 'number' : keyboardType}
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        data-testid={testID}
        aria-invalid={!!error}
        style={inputStyle}
      />
      {error && <span style={errorStyle}>{error}</span>}
      {!error && helperText && <span style={helperStyle}>{helperText}</span>}
    </div>
  );
};

export default TextInput;
