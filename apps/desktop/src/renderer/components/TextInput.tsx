// Desktop TextInput Component
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';

export interface TextInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  testID?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  type = 'text',
  disabled = false,
  testID,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: Spacing.xs, width: '100%' }}>
      {label && (
        <label style={{ fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.medium, color: Colors.textSecondary }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        data-testid={testID}
        style={{
          padding: `${Spacing.sm}px ${Spacing.md}px`,
          borderRadius: Spacing.borderRadius.md,
          border: `1px solid ${Colors.border}`,
          backgroundColor: disabled ? Colors.surfaceSubtle : Colors.surface,
          color: Colors.textPrimary,
          fontSize: Typography.fontSizes.sm,
          outline: 'none',
          boxSizing: 'border-box',
          width: '100%',
        }}
      />
    </div>
  );
};

export default TextInput;
