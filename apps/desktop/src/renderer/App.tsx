// Desktop Root App Component
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DesktopNavRoute } from './types';
import { Colors } from './theme';
import { Sidebar, TopBar } from './components';

// Screens
import LoginScreen from './screens/auth/LoginScreen';
import DoctorDashboardScreen from './screens/doctor/DoctorDashboardScreen';
import FacilityManagerDashboardScreen from './screens/facility/FacilityManagerDashboardScreen';
import DistrictAdminDashboardScreen from './screens/district/DistrictAdminDashboardScreen';
import BedManagementScreen from './screens/beds/BedManagementScreen';
import EquipmentManagementScreen from './screens/equipment/EquipmentManagementScreen';
import InventoryManagementScreen from './screens/inventory/InventoryManagementScreen';
import StaleDataMonitoringScreen from './screens/stale/StaleDataMonitoringScreen';
import ReferralManagementScreen from './screens/referrals/ReferralManagementScreen';
import AppointmentManagementScreen from './screens/appointments/AppointmentManagementScreen';

const MainLayout: React.FC = () => {
  const { isAuthenticated, role } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<DesktopNavRoute>(() => {
    if (role === 'DOCTOR') return 'DOCTOR_DASHBOARD';
    if (role === 'SUPER_ADMIN') return 'DISTRICT_DASHBOARD';
    return 'FACILITY_DASHBOARD';
  });

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const getTitle = () => {
    switch (currentRoute) {
      case 'DOCTOR_DASHBOARD':
        return 'Doctor Clinical Dashboard';
      case 'FACILITY_DASHBOARD':
        return 'Facility Operations Overview';
      case 'DISTRICT_DASHBOARD':
        return 'District Administration & Aggregates';
      case 'BEDS':
        return 'Bed Allocation & Ward Status';
      case 'EQUIPMENT':
        return 'Medical Equipment & Device Management';
      case 'INVENTORY':
        return 'Pharmacy & Medicine Inventory';
      case 'STALE_MONITOR':
        return 'Stale Data Escalation Monitor';
      case 'REFERRALS':
        return 'Patient Referral Workflow';
      case 'APPOINTMENTS':
        return 'Appointments & Consultation Schedules';
      default:
        return 'CareGrid Desktop';
    }
  };

  const renderScreen = () => {
    switch (currentRoute) {
      case 'DOCTOR_DASHBOARD':
        return <DoctorDashboardScreen />;
      case 'FACILITY_DASHBOARD':
        return <FacilityManagerDashboardScreen />;
      case 'DISTRICT_DASHBOARD':
        return <DistrictAdminDashboardScreen />;
      case 'BEDS':
        return <BedManagementScreen />;
      case 'EQUIPMENT':
        return <EquipmentManagementScreen />;
      case 'INVENTORY':
        return <InventoryManagementScreen />;
      case 'STALE_MONITOR':
        return <StaleDataMonitoringScreen />;
      case 'REFERRALS':
        return <ReferralManagementScreen />;
      case 'APPOINTMENTS':
        return <AppointmentManagementScreen />;
      default:
        return <DoctorDashboardScreen />;
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: Colors.background }}>
      <Sidebar currentRoute={currentRoute} onNavigate={setCurrentRoute} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar title={getTitle()} />
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {renderScreen()}
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

export default App;
