// Role-based Navigation Routing Helpers

import { UserRole } from '@rhcp/shared-types';
import { RootStackParamList } from './types';

export const Routes = {
  Auth: {
    Login: 'Login' as const,
  },
  Asha: {
    Home: 'AshaHome' as const,
    ReferralList: 'ReferralList' as const,
    CreateReferral: 'CreateReferral' as const,
    FacilityAvailability: 'FacilityAvailability' as const,
    BookAppointment: 'BookAppointment' as const,
    EmergencyDispatch: 'EmergencyDispatch' as const,
  },
  Doctor: {
    Home: 'DoctorHome' as const,
    IncomingReferrals: 'IncomingReferrals' as const,
    ReferralDetail: 'ReferralDetail' as const,
    DoctorAppointments: 'DoctorAppointments' as const,
    MedicineSearch: 'MedicineSearch' as const,
    FacilityBeds: 'FacilityBeds' as const,
  },
  Ambulance: {
    Home: 'AmbulanceHome' as const,
    EmergencyMode: 'EmergencyMode' as const,
    NearbyFacilities: 'NearbyFacilities' as const,
    TransportStatus: 'TransportStatus' as const,
  },
  FacilityAdmin: {
    Dashboard: 'FacilityDashboard' as const,
    BedManagement: 'BedManagement' as const,
    EquipmentManagement: 'EquipmentManagement' as const,
    MedicineInventory: 'MedicineInventory' as const,
    FreshnessEscalations: 'FreshnessEscalations' as const,
  },
  DistrictAdmin: {
    Overview: 'DistrictOverview' as const,
    FacilitiesList: 'FacilitiesList' as const,
    StaleAlerts: 'StaleAlerts' as const,
    EscalationsView: 'EscalationsView' as const,
  },
};

/**
 * Determines the appropriate root navigation stack for a given user role
 */
export function getRootFlowForRole(role?: UserRole | null): keyof RootStackParamList {
  if (!role) {
    return 'Auth';
  }

  switch (role) {
    case 'ASHA_WORKER':
    case 'PHC_STAFF':
      return 'AshaFlow';

    case 'DOCTOR':
      return 'DoctorFlow';

    case 'AMBULANCE_STAFF':
      return 'AmbulanceFlow';

    case 'FACILITY_STAFF':
    case 'HOSPITAL_ADMIN':
      return 'FacilityAdminFlow';

    case 'SUPER_ADMIN':
      return 'DistrictAdminFlow';

    default:
      return 'Auth';
  }
}
