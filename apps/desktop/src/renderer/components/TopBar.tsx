// Desktop TopBar Component
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';
import { useAuth } from '../context/AuthContext';
import { Language } from '../types';
import { t } from '../i18n';

export interface TopBarProps {
  title: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ title, onRefresh, isLoading }) => {
  const { language, changeLanguage } = useAuth();

  return (
    <div
      style={{
        height: 60,
        backgroundColor: Colors.surface,
        borderBottom: `1px solid ${Colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 ${Spacing.lg}px`,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.md }}>
        <h1
          style={{
            margin: 0,
            fontSize: Typography.fontSizes.lg,
            fontWeight: Typography.fontWeights.bold,
            color: Colors.textPrimary,
          }}
        >
          {title}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.md }}>
        {/* Language Selector */}
        <select
          value={language}
          onChange={(e) => changeLanguage(e.target.value as Language)}
          data-testid="desktop-lang-select"
          style={{
            padding: `${Spacing.xs}px ${Spacing.sm}px`,
            borderRadius: Spacing.borderRadius.sm,
            border: `1px solid ${Colors.border}`,
            backgroundColor: Colors.surface,
            fontSize: Typography.fontSizes.xs,
            fontWeight: Typography.fontWeights.medium,
            cursor: 'pointer',
          }}
        >
          <option value="ENGLISH">English</option>
          <option value="MARATHI">मराठी (Marathi)</option>
          <option value="HINDI">हिंदी (Hindi)</option>
        </select>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            data-testid="topbar-refresh-btn"
            style={{
              padding: `${Spacing.xs}px ${Spacing.md}px`,
              backgroundColor: Colors.surfaceSubtle,
              border: `1px solid ${Colors.border}`,
              borderRadius: Spacing.borderRadius.sm,
              fontSize: Typography.fontSizes.xs,
              fontWeight: Typography.fontWeights.medium,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: Spacing.xs,
            }}
          >
            <span>{isLoading ? '⏳' : '🔄'}</span>
            <span>{t('refresh')}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TopBar;
