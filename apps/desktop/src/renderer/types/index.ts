// Desktop App Types Re-export and UI State Definitions

export * from '@rhcp/shared-types';

export type DesktopNavRoute =
  | 'DOCTOR_DASHBOARD'
  | 'FACILITY_DASHBOARD'
  | 'DISTRICT_DASHBOARD'
  | 'BEDS'
  | 'EQUIPMENT'
  | 'INVENTORY'
  | 'STALE_MONITOR'
  | 'REFERRALS'
  | 'APPOINTMENTS'
  | 'LOGIN';

export interface UserSession {
  accessToken: string;
  refreshToken: string;
  user: import('@rhcp/shared-types').AuthUser;
}

export interface MetricCardData {
  title: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}
