// Accessible Modal Confirmation Dialog for Irreversible Operations
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';
import { Button } from './Button';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  testID?: string;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
  testID,
}) => {
  if (!isOpen) return null;

  return (
    <div
      data-testid={testID}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: Spacing.lg,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          backgroundColor: Colors.surface,
          borderRadius: Spacing.borderRadius.lg,
          padding: Spacing.xl,
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h3 style={{ margin: 0, fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary }}>
          {title}
        </h3>
        <p style={{ fontSize: Typography.fontSizes.sm, color: Colors.textSecondary, margin: `${Spacing.md}px 0` }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: Spacing.md, marginTop: Spacing.lg }}>
          <div style={{ flex: 1 }}>
            <Button
              title={cancelLabel}
              onPress={onCancel}
              variant="outline"
              disabled={isLoading}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Button
              title={confirmLabel}
              onPress={onConfirm}
              variant={isDestructive ? 'danger' : 'primary'}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
