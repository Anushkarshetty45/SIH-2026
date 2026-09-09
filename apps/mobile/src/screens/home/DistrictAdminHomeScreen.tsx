// District Health Authority Overview Screen
import React from 'react';
import { Colors, Spacing, Typography } from '../../theme';
import { StaleDataWarning } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../i18n';

export const DistrictAdminHomeScreen: React.FC = () => {
  const { user, logout, switchLanguage, activeLanguage } = useAuth();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: Colors.background, paddingBottom: Spacing.xxl }}>
      {/* Top Header */}
      <div
        style={{
          backgroundColor: Colors.secondary,
          color: Colors.textInverse,
          padding: `${Spacing.lg}px ${Spacing.md}px`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: Typography.fontSizes.xs, opacity: 0.9 }}>
            🏛️ {t('roles.SUPER_ADMIN')} • District Health Authority, Pune
          </div>
          <h2 style={{ margin: 0, fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold }}>
            {user?.name || 'District Officer'}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: Spacing.xs }}>
          <button
            type="button"
            onClick={() => switchLanguage(activeLanguage === 'mr' ? 'en' : 'mr')}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: Colors.textInverse,
              border: 'none',
              borderRadius: Spacing.borderRadius.sm,
              padding: `${Spacing.xs}px ${Spacing.sm}px`,
              fontSize: Typography.fontSizes.xs,
              cursor: 'pointer',
            }}
          >
            {activeLanguage === 'mr' ? 'English' : 'मराठी'}
          </button>
          <button
            type="button"
            onClick={logout}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: Colors.textInverse,
              border: 'none',
              borderRadius: Spacing.borderRadius.sm,
              padding: `${Spacing.xs}px ${Spacing.sm}px`,
              fontSize: Typography.fontSizes.xs,
              cursor: 'pointer',
            }}
          >
            {t('auth.logout')}
          </button>
        </div>
      </div>

      <div style={{ padding: Spacing.md }}>
        {/* District High-level Overview Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.sm, marginBottom: Spacing.md }}>
          <div style={{ padding: Spacing.md, backgroundColor: Colors.surface, borderRadius: Spacing.borderRadius.lg, border: `1px solid ${Colors.border}` }}>
            <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>Facilities Monitored</div>
            <div style={{ fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.bold, color: Colors.primary }}>14</div>
          </div>
          <div style={{ padding: Spacing.md, backgroundColor: Colors.surface, borderRadius: Spacing.borderRadius.lg, border: `1px solid ${Colors.border}` }}>
            <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>Active Referrals</div>
            <div style={{ fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.bold, color: Colors.status.available.text }}>28</div>
          </div>
        </div>

        {/* Operational Freshness Alerts (> 2h without update) */}
        <div
          style={{
            backgroundColor: Colors.surface,
            borderRadius: Spacing.borderRadius.lg,
            border: `1px solid ${Colors.border}`,
            padding: Spacing.md,
            marginBottom: Spacing.md,
          }}
        >
          <h3 style={{ margin: `0 0 ${Spacing.sm}px 0`, fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.status.lowStock.text }}>
            ⚠️ Overdue Freshness Updates (Tier 2 Escalations)
          </h3>
          <p style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary, marginBottom: Spacing.sm }}>
            The following facilities have not submitted resource verification within the 2-hour window:
          </p>

          <div style={{ borderTop: `1px solid ${Colors.borderLight}`, paddingTop: Spacing.sm }}>
            <div style={{ fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.semibold }}>
              • PHC Narayangaon
            </div>
            <StaleDataWarning lastUpdatedAt={new Date(Date.now() - 145 * 60 * 1000).toISOString()} resourceName="bed data" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistrictAdminHomeScreen;
