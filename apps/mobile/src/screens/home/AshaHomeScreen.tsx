// ASHA Worker / PHC Staff Home Screen
import React, { useState } from 'react';
import { Colors, Spacing, Typography } from '../../theme';
import { Button, StatusBadge, StaleDataWarning, OfflineBanner, SyncStatus } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../i18n';

export const AshaHomeScreen: React.FC = () => {
  const { user, logout, switchLanguage, activeLanguage } = useAuth();
  const [networkStatus] = useState<'ONLINE' | 'OFFLINE' | 'SYNCING' | 'SYNC_FAILED'>('ONLINE');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: Colors.background, paddingBottom: Spacing.xxl }}>
      <OfflineBanner status={networkStatus} lastSyncedText="5 min ago" />

      {/* Top Header */}
      <div
        style={{
          backgroundColor: Colors.primary,
          color: Colors.textInverse,
          padding: `${Spacing.lg}px ${Spacing.md}px`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: Typography.fontSizes.xs, opacity: 0.9 }}>
            {t('roles.ASHA_WORKER')} • PHC Khed
          </div>
          <h2 style={{ margin: 0, fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold }}>
            {user?.name || 'ASHA Worker'}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: Spacing.xs, alignItems: 'center' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
          <SyncStatus status={networkStatus} pendingCount={0} lastSyncedText="10:30 AM" />
        </div>

        {/* Primary Action Button */}
        <div style={{ marginBottom: Spacing.lg }}>
          <Button
            title={`+ ${t('referrals.create')}`}
            onPress={() => alert('Referral Creation Flow — Milestone 3')}
            variant="primary"
          />
        </div>

        {/* Section 1: Pending Referrals */}
        <div
          style={{
            backgroundColor: Colors.surface,
            borderRadius: Spacing.borderRadius.lg,
            border: `1px solid ${Colors.border}`,
            padding: Spacing.md,
            marginBottom: Spacing.md,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
            <h3 style={{ margin: 0, fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary }}>
              📋 {t('referrals.title')}
            </h3>
            <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.primary, fontWeight: Typography.fontWeights.semibold }}>
              2 Active
            </span>
          </div>

          <div style={{ borderTop: `1px solid ${Colors.borderLight}`, paddingTop: Spacing.sm }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: Typography.fontSizes.sm }}>Sunita Patil</strong>
                <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>➔ Sub-District Hospital Manchar</div>
              </div>
              <StatusBadge label={t('referrals.statusPending')} variant="pending" />
            </div>
            <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.status.timedOut.text, marginTop: Spacing.xs }}>
              ⏱ {t('referrals.timeoutNotice')}
            </div>
          </div>
        </div>

        {/* Section 2: Today's Appointments */}
        <div
          style={{
            backgroundColor: Colors.surface,
            borderRadius: Spacing.borderRadius.lg,
            border: `1px solid ${Colors.border}`,
            padding: Spacing.md,
            marginBottom: Spacing.md,
          }}
        >
          <h3 style={{ margin: 0, fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary, marginBottom: Spacing.sm }}>
            📅 {t('appointments.title')}
          </h3>
          <div style={{ borderTop: `1px solid ${Colors.borderLight}`, paddingTop: Spacing.sm }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: Typography.fontSizes.sm }}>Ramesh Shinde</strong>
                <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>Dr. Deshmukh • 11:30 AM</div>
              </div>
              <StatusBadge label={t('appointments.statusConfirmed')} variant="confirmed" />
            </div>
          </div>
        </div>

        {/* Section 3: Nearby Facility Bed Availability with Stale Warning */}
        <div
          style={{
            backgroundColor: Colors.surface,
            borderRadius: Spacing.borderRadius.lg,
            border: `1px solid ${Colors.border}`,
            padding: Spacing.md,
          }}
        >
          <h3 style={{ margin: 0, fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary, marginBottom: Spacing.sm }}>
            🏥 {t('beds.title')} (Nearby Facilities)
          </h3>
          <div style={{ borderTop: `1px solid ${Colors.borderLight}`, paddingTop: Spacing.sm }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs }}>
              <span style={{ fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.semibold }}>
                Sub-District Hospital Manchar
              </span>
              <StatusBadge label="4 ICU Beds" variant="available" />
            </div>
            <StaleDataWarning lastUpdatedAt={new Date(Date.now() - 35 * 60 * 1000).toISOString()} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AshaHomeScreen;
