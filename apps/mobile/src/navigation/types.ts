// CareGrid Mobile Navigation Types

import { UserRole } from '@rhcp/shared-types';

export type AuthStackParamList = {
  Login: undefined;
};

export type AshaStackParamList = {
  AshaHome: undefined;
  ReferralList: undefined;
  CreateReferral: { patientId?: string };
  FacilityAvailability: { facilityId?: string };
  BookAppointment: { doctorId?: string; facilityId?: string };
  EmergencyDispatch: undefined;
};

export type DoctorStackParamList = {
  DoctorHome: undefined;
  IncomingReferrals: undefined;
  ReferralDetail: { referralId: string };
  DoctorAppointments: undefined;
  MedicineSearch: undefined;
  FacilityBeds: undefined;
};

export type AmbulanceStackParamList = {
  AmbulanceHome: undefined;
  EmergencyMode: undefined;
  NearbyFacilities: undefined;
  TransportStatus: { transportId: string };
};

export type FacilityAdminStackParamList = {
  FacilityDashboard: undefined;
  BedManagement: undefined;
  EquipmentManagement: undefined;
  MedicineInventory: undefined;
  FreshnessEscalations: undefined;
};

export type DistrictAdminStackParamList = {
  DistrictOverview: undefined;
  FacilitiesList: undefined;
  StaleAlerts: undefined;
  EscalationsView: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  AshaFlow: undefined;
  DoctorFlow: undefined;
  AmbulanceFlow: undefined;
  FacilityAdminFlow: undefined;
  DistrictAdminFlow: undefined;
};
