// Shared TypeScript types — populated as domain modules are implemented.

export type UserRole =
  | 'ASHA_WORKER'
  | 'PHC_STAFF'
  | 'DOCTOR'
  | 'FACILITY_STAFF'
  | 'HOSPITAL_ADMIN'
  | 'AMBULANCE_STAFF'
  | 'SUPER_ADMIN';

export type FacilityType = 'PHC' | 'CHC' | 'DISTRICT_HOSPITAL' | 'CITY_HOSPITAL' | 'PRIVATE_CLINIC';

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
