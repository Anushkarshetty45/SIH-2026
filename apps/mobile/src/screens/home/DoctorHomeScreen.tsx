// Doctor Home & Clinical Coordination Dashboard Screen
import React, { useState } from 'react';
import { Colors, Spacing, Typography } from '../../theme';
import { ReferralCard, StaleDataWarning } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../i18n';
import { Referral } from '../../types';

export const DoctorHomeScreen: React.FC = () => {
  const { user, logout, switchLanguage, activeLanguage } = useAuth();

  // Demo incoming referral state
  const [referrals, setReferrals] = useState<Referral[]>([
    {
      id: 'ref-001',
      patientId: 'pat-001',
      createdById: 'user-asha-1',
      fromFacilityId: 'fac-phc-khed',
      toFacilityId: 'fac-sdh-manchar',
      status: 'PENDING_DOCTOR_APPROVAL',
      urgency: 'HIGH',
      clinicalNotes: 'Persistent high fever, severe breathlessness for 3 days.',
      timeoutAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      patient: {
        id: 'pat-001',
        name: 'Ganesh Chavan',
        preferredLanguage: 'MARATHI',
        consentStatus: 'GRANTED',
      },
      fromFacility: {
        id: 'fac-phc-khed',
        name: 'PHC Khed',
        type: 'PHC',
        status: 'ACTIVE',
        address: 'Khed, Pune',
        district: 'Pune',
        state: 'Maharashtra',
        pincode: '410501',
        lastUpdatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    },
  ]);

  const handleApprove = (id: string) => {
    setReferrals((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'APPROVED' as const } : r))
    );
  };

  const handleReject = (id: string) => {
    setReferrals((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'REJECTED' as const } : r))
    );
  };

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
            👨‍⚕️ {t('roles.DOCTOR')} • General Medicine
          </div>
          <h2 style={{ margin: 0, fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold }}>
            Dr. {user?.name || 'Clinician'}
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
        {/* Section: Incoming Referrals */}
        <div style={{ marginBottom: Spacing.lg }}>
          <h3 style={{ margin: `0 0 ${Spacing.sm}px 0`, fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary }}>
            📥 {t('referrals.title')} ({referrals.filter((r) => r.status === 'PENDING_DOCTOR_APPROVAL').length} Pending)
          </h3>

          {referrals.map((referral) => (
            <ReferralCard
              key={referral.id}
              referral={referral}
              showDoctorActions
              onApprove={() => handleApprove(referral.id)}
              onReject={() => handleReject(referral.id)}
            />
          ))}
        </div>

        {/* Section: Today's Schedule */}
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
            📅 {t('appointments.title')} (Today's OPD)
          </h3>
          <p style={{ fontSize: Typography.fontSizes.sm, color: Colors.textSecondary, margin: 0 }}>
            • 10:00 AM — Ramesh Shinde (Follow-up)
          </p>
          <p style={{ fontSize: Typography.fontSizes.sm, color: Colors.textSecondary, margin: `${Spacing.xs}px 0 0 0` }}>
            • 11:30 AM — Anusaya Gaikwad (OPD Consultation)
          </p>
        </div>

        {/* Section: Bed Availability Quick Status */}
        <div
          style={{
            backgroundColor: Colors.surface,
            borderRadius: Spacing.borderRadius.lg,
            border: `1px solid ${Colors.border}`,
            padding: Spacing.md,
          }}
        >
          <h3 style={{ margin: 0, fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary, marginBottom: Spacing.sm }}>
            🏥 Hospital Ward Capacity
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: Typography.fontSizes.sm, marginBottom: Spacing.xs }}>
            <span>ICU: <strong>2 Available</strong></span>
            <span>Oxygen: <strong>5 Available</strong></span>
            <span>General: <strong>14 Available</strong></span>
          </div>
          <StaleDataWarning lastUpdatedAt={new Date(Date.now() - 42 * 60 * 1000).toISOString()} />
        </div>
      </div>
    </div>
  );
};

export default DoctorHomeScreen;
