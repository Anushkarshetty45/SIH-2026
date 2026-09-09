// Facility Administrator Dashboard Screen
import React from 'react';
import { Colors, Spacing, Typography } from '../../theme';
import { StaleDataWarning } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../i18n';

export const FacilityAdminHomeScreen: React.FC = () => {
  const { user, logout, switchLanguage, activeLanguage } = useAuth();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: Colors.background, paddingBottom: Spacing.xxl }}>
      {/* Header */}
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
            🏥 {t('roles.HOSPITAL_ADMIN')} • Sub-District Hospital Manchar
          </div>
          <h2 style={{ margin: 0, fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold }}>
            {user?.name || 'Facility Administrator'}
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
        {/* Bed Capacity Summary */}
        <div
          style={{
            backgroundColor: Colors.surface,
            borderRadius: Spacing.borderRadius.lg,
            border: `1px solid ${Colors.border}`,
            padding: Spacing.md,
            marginBottom: Spacing.md,
          }}
        >
          <h3 style={{ margin: `0 0 ${Spacing.sm}px 0`, fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary }}>
            🛏️ {t('beds.title')} Overview
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.sm, marginBottom: Spacing.sm }}>
            <div style={{ padding: Spacing.sm, backgroundColor: Colors.surfaceSubtle, borderRadius: Spacing.borderRadius.md }}>
              <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>General Ward</div>
              <div style={{ fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary }}>12 / 20 Available</div>
            </div>
            <div style={{ padding: Spacing.sm, backgroundColor: Colors.surfaceSubtle, borderRadius: Spacing.borderRadius.md }}>
              <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>ICU Beds</div>
              <div style={{ fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.status.available.text }}>2 / 6 Available</div>
            </div>
          </div>
          <StaleDataWarning lastUpdatedAt={new Date(Date.now() - 25 * 60 * 1000).toISOString()} />
        </div>

        {/* Equipment Status */}
        <div
          style={{
            backgroundColor: Colors.surface,
            borderRadius: Spacing.borderRadius.lg,
            border: `1px solid ${Colors.border}`,
            padding: Spacing.md,
            marginBottom: Spacing.md,
          }}
        >
          <h3 style={{ margin: `0 0 ${Spacing.sm}px 0`, fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary }}>
            ⚙️ Medical Equipment Status
          </h3>
          <p style={{ fontSize: Typography.fontSizes.sm, color: Colors.textPrimary, margin: 0 }}>
            • Ultrasound Scanner: <strong>Operational (1/1)</strong>
          </p>
          <p style={{ fontSize: Typography.fontSizes.sm, color: Colors.textPrimary, margin: `${Spacing.xs}px 0 0 0` }}>
            • X-Ray Machine: <strong>Operational (1/1)</strong>
          </p>
          <p style={{ fontSize: Typography.fontSizes.sm, color: Colors.status.lowStock.text, margin: `${Spacing.xs}px 0 0 0` }}>
            • Ventilator Unit #2: <strong>Under Maintenance (1 unit)</strong>
          </p>
        </div>

        {/* Medicine Stock Alerts */}
        <div
          style={{
            backgroundColor: Colors.surface,
            borderRadius: Spacing.borderRadius.lg,
            border: `1px solid ${Colors.border}`,
            padding: Spacing.md,
          }}
        >
          <h3 style={{ margin: `0 0 ${Spacing.sm}px 0`, fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary }}>
            💊 Pharmacy & Stock Alerts
          </h3>
          <p style={{ fontSize: Typography.fontSizes.sm, color: Colors.status.outOfStock.text, margin: 0, fontWeight: Typography.fontWeights.semibold }}>
            ⚠️ Amoxicillin 500mg: OUT OF STOCK (Controlled alternatives mapped)
          </p>
          <p style={{ fontSize: Typography.fontSizes.sm, color: Colors.status.lowStock.text, margin: `${Spacing.xs}px 0 0 0` }}>
            ⚠️ Paracetamol 500mg: Low Stock (45 tablets remaining)
          </p>
        </div>
      </div>
    </div>
  );
};

export default FacilityAdminHomeScreen;
