// Ambulance Staff Emergency Operations Screen
import React, { useState } from 'react';
import { Colors, Spacing, Typography } from '../../theme';
import { Button, StatusBadge, StaleDataWarning } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../i18n';
import { TransportStatus } from '../../types';

export const AmbulanceHomeScreen: React.FC = () => {
  const { user, logout, switchLanguage, activeLanguage } = useAuth();
  const [transportStatus, setTransportStatus] = useState<TransportStatus>('EN_ROUTE');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: Colors.background, paddingBottom: Spacing.xxl }}>
      {/* Emergency Header */}
      <div
        style={{
          backgroundColor: Colors.emergency.surface,
          color: Colors.textInverse,
          padding: `${Spacing.lg}px ${Spacing.md}px`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: Typography.fontSizes.xs, opacity: 0.9 }}>
            🚑 {t('roles.AMBULANCE_STAFF')} • MH-14-AZ-1080
          </div>
          <h2 style={{ margin: 0, fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold }}>
            {user?.name || 'Ambulance Operator'}
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
        {/* Active Emergency Transport Status Card */}
        <div
          style={{
            backgroundColor: Colors.surface,
            borderRadius: Spacing.borderRadius.lg,
            border: `2px solid ${Colors.emergency.border}`,
            padding: Spacing.md,
            marginBottom: Spacing.lg,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
            <h3 style={{ margin: 0, fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.emergency.surface }}>
              🚨 Active Emergency Run
            </h3>
            <StatusBadge label={transportStatus} variant={transportStatus === 'COMPLETED' ? 'confirmed' : 'pending'} />
          </div>

          <div style={{ fontSize: Typography.fontSizes.sm, color: Colors.textPrimary, marginBottom: Spacing.xs }}>
            <strong>Patient:</strong> Critical Cardiac Emergency (Age 58)
          </div>
          <div style={{ fontSize: Typography.fontSizes.sm, color: Colors.textSecondary, marginBottom: Spacing.md }}>
            <strong>Destination:</strong> District Hospital Aundh (ETA ~18 mins)
          </div>

          <div style={{ display: 'flex', gap: Spacing.sm }}>
            {transportStatus === 'EN_ROUTE' && (
              <Button
                title="Mark Arrived at Facility"
                onPress={() => setTransportStatus('ARRIVED')}
                variant="primary"
              />
            )}
            {transportStatus === 'ARRIVED' && (
              <Button
                title="Complete Emergency Transport"
                onPress={() => setTransportStatus('COMPLETED')}
                variant="secondary"
              />
            )}
          </div>
        </div>

        {/* Nearest Facilities with ICU / Oxygen Beds */}
        <h3 style={{ margin: `0 0 ${Spacing.sm}px 0`, fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary }}>
          🏥 Nearest Emergency Receiving Facilities
        </h3>

        <div
          style={{
            backgroundColor: Colors.surface,
            borderRadius: Spacing.borderRadius.lg,
            border: `1px solid ${Colors.border}`,
            padding: Spacing.md,
            marginBottom: Spacing.md,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold }}>
              District Hospital Aundh
            </h4>
            <span style={{ fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semibold, color: Colors.primary }}>
              6.2 km
            </span>
          </div>
          <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textPrimary, margin: `${Spacing.xs}px 0` }}>
            ICU Beds: <strong>3 Available</strong> • Ventilator: <strong>1 Available</strong>
          </div>
          <StaleDataWarning
            lastUpdatedAt={new Date(Date.now() - 15 * 60 * 1000).toISOString()}
            isEmergencyMode
          />
        </div>

        <div
          style={{
            backgroundColor: Colors.surface,
            borderRadius: Spacing.borderRadius.lg,
            border: `1px solid ${Colors.border}`,
            padding: Spacing.md,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold }}>
              Sub-District Hospital Manchar
            </h4>
            <span style={{ fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semibold, color: Colors.primary }}>
              14.5 km
            </span>
          </div>
          <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textPrimary, margin: `${Spacing.xs}px 0` }}>
            ICU Beds: <strong>0 Available (Full)</strong> • Oxygen: <strong>4 Available</strong>
          </div>
          <StaleDataWarning
            lastUpdatedAt={new Date(Date.now() - 135 * 60 * 1000).toISOString()}
            isEmergencyMode
          />
        </div>
      </div>
    </div>
  );
};

export default AmbulanceHomeScreen;
