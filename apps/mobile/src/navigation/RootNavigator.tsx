// Root Navigation Dispatcher with Role-Based Routing
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/LoadingState';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { AshaHomeScreen } from '../screens/home/AshaHomeScreen';
import { DoctorHomeScreen } from '../screens/home/DoctorHomeScreen';
import { AmbulanceHomeScreen } from '../screens/home/AmbulanceHomeScreen';
import { FacilityAdminHomeScreen } from '../screens/home/FacilityAdminHomeScreen';
import { DistrictAdminHomeScreen } from '../screens/home/DistrictAdminHomeScreen';
import { getRootFlowForRole } from './routes';
import { Colors, Spacing, Typography } from '../theme';
import { Button } from '../components/Button';
import { t } from '../i18n';

export const PermissionDeniedScreen: React.FC = () => {
  const { logout } = useAuth();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: Spacing.xl,
        backgroundColor: Colors.background,
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: 48, marginBottom: Spacing.md }} aria-hidden="true">
        🚫
      </span>
      <h2 style={{ fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.bold, color: Colors.emergency.surface, margin: 0 }}>
        403 — {t('errors.forbidden')}
      </h2>
      <p style={{ fontSize: Typography.fontSizes.sm, color: Colors.textSecondary, margin: `${Spacing.md}px 0 ${Spacing.lg}px 0`, maxWidth: 300 }}>
        You do not have access to this role module. Please log in with an authorized account.
      </p>
      <div style={{ width: 160 }}>
        <Button title={t('auth.logout')} onPress={logout} variant="primary" />
      </div>
    </div>
  );
};

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: Colors.background }}>
        <LoadingState message={t('common.loading')} />
      </div>
    );
  }

  if (!isAuthenticated || !role) {
    return <LoginScreen />;
  }

  const flow = getRootFlowForRole(role);

  switch (flow) {
    case 'AshaFlow':
      return <AshaHomeScreen />;
    case 'DoctorFlow':
      return <DoctorHomeScreen />;
    case 'AmbulanceFlow':
      return <AmbulanceHomeScreen />;
    case 'FacilityAdminFlow':
      return <FacilityAdminHomeScreen />;
    case 'DistrictAdminFlow':
      return <DistrictAdminHomeScreen />;
    default:
      return <PermissionDeniedScreen />;
  }
};

export default RootNavigator;
