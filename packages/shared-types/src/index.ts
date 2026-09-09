// Shared TypeScript types for CareGrid (Rural Healthcare Coordination Platform)

// ─────────────────────────────────────────────────────────────────────────────
// Core Domain Enums
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole =
  | 'ASHA_WORKER'
  | 'PHC_STAFF'
  | 'DOCTOR'
  | 'FACILITY_STAFF'
  | 'HOSPITAL_ADMIN'
  | 'AMBULANCE_STAFF'
  | 'SUPER_ADMIN';

export type Language = 'MARATHI' | 'HINDI' | 'ENGLISH';

export type FacilityType =
  | 'PHC'
  | 'CHC'
  | 'DISTRICT_HOSPITAL'
  | 'CITY_HOSPITAL'
  | 'PRIVATE_CLINIC';

export type FacilityStatus = 'ACTIVE' | 'INACTIVE';

export type ConsentStatus = 'PENDING' | 'GRANTED' | 'REVOKED';

export type ReferralStatus =
  | 'PENDING_DOCTOR_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'TIMED_OUT'
  | 'CANCELLED'
  | 'COMPLETED';

export type ReferralUrgency = 'NORMAL' | 'HIGH' | 'EMERGENCY';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED';

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export type BedCategory =
  | 'GENERAL'
  | 'ICU'
  | 'OXYGEN'
  | 'VENTILATOR'
  | 'MATERNITY'
  | 'PEDIATRIC';

export type BedStatus =
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'RESERVED'
  | 'MAINTENANCE'
  | 'UNAVAILABLE';

export type EquipmentStatus =
  | 'OPERATIONAL'
  | 'UNDER_MAINTENANCE'
  | 'DEFECTIVE'
  | 'UNAVAILABLE';

export type StockStatus = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export type StockTransactionType = 'RECEIPT' | 'ISSUE' | 'ADJUSTMENT' | 'CORRECTION';

export type TransportStatus =
  | 'DISPATCHED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'CANCELLED';

export type FreshnessStatus = 'CURRENT' | 'STALE' | 'UNKNOWN';

// ─────────────────────────────────────────────────────────────────────────────
// Common Pagination & API Responses
// ─────────────────────────────────────────────────────────────────────────────

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

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp?: string;
  path?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Module
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  preferredLanguage: Language;
  phone?: string | null;
  facilityId?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  preferredLanguage?: Language;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// User & Profile
// ─────────────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  preferredLanguage: Language;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateLanguageDto {
  language: Language;
}

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Facilities & Availability
// ─────────────────────────────────────────────────────────────────────────────

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  status: FacilityStatus;
  address: string;
  district: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  contactPhone?: string | null;
  lastUpdatedAt: string;
  createdAt: string;
}

export interface FacilityBedSummary {
  category: BedCategory;
  total: number;
  available: number;
  occupied: number;
}

export interface FacilityEquipmentSummary {
  name: string;
  category: string;
  total: number;
  available: number;
  status: EquipmentStatus;
}

export interface FacilityAvailabilityProfile {
  facilityId: string;
  facilityName: string;
  lastUpdatedAt: string;
  freshnessStatus: FreshnessStatus;
  isStale: boolean;
  staleMinutes: number;
  beds: FacilityBedSummary[];
  equipment: FacilityEquipmentSummary[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Doctors & Appointments
// ─────────────────────────────────────────────────────────────────────────────

export interface Doctor {
  id: string;
  userId: string;
  facilityId: string;
  specialization: string;
  registrationNo: string;
  isAvailable: boolean;
  name?: string;
  facilityName?: string;
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  facilityId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
}

export interface AppointmentSlot {
  id: string;
  doctorId: string;
  facilityId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
}

export interface Patient {
  id: string;
  name: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  phone?: string | null;
  address?: string | null;
  district?: string | null;
  state?: string | null;
  abhaId?: string | null;
  preferredLanguage: Language;
  consentStatus: ConsentStatus;
  registeredById?: string | null;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  facilityId: string;
  slotId: string;
  status: AppointmentStatus;
  notes?: string | null;
  referralId?: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: Patient;
  doctor?: Doctor;
  slot?: AppointmentSlot;
  facility?: Facility;
}

export interface BookAppointmentDto {
  patientId: string;
  doctorId: string;
  facilityId: string;
  slotId: string;
  notes?: string;
  referralId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Referrals
// ─────────────────────────────────────────────────────────────────────────────

export interface Referral {
  id: string;
  patientId: string;
  createdById: string;
  fromFacilityId: string;
  toFacilityId: string;
  receivingDoctorId?: string | null;
  respondingDoctorId?: string | null;
  status: ReferralStatus;
  urgency: ReferralUrgency;
  clinicalNotes?: string | null;
  rejectionReason?: string | null;
  timeoutAt?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: Patient;
  fromFacility?: Facility;
  toFacility?: Facility;
  receivingDoctor?: Doctor;
}

export interface CreateReferralDto {
  patientId: string;
  toFacilityId: string;
  receivingDoctorId?: string;
  urgency?: ReferralUrgency;
  clinicalNotes?: string;
}

export interface RespondReferralDto {
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Beds & Equipment
// ─────────────────────────────────────────────────────────────────────────────

export interface Bed {
  id: string;
  facilityId: string;
  bedNumber: string;
  ward: string;
  category: BedCategory;
  status: BedStatus;
  lastUpdatedAt: string;
  updatedById?: string | null;
}

export interface Equipment {
  id: string;
  facilityId: string;
  name: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  status: EquipmentStatus;
  lastUpdatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Medicines & Inventory
// ─────────────────────────────────────────────────────────────────────────────

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  dosageForm: string;
  strength: string;
  category?: string | null;
  manufacturer?: string | null;
  unit: string;
  description?: string | null;
  isActive: boolean;
}

export interface ControlledAlternative {
  id: string;
  name: string;
  genericName: string;
  dosageForm: string;
  strength: string;
  unit: string;
  notes?: string | null;
  isAvailableAtFacility?: boolean;
  currentStock?: number;
}

export interface MedicineStock {
  id: string;
  facilityId: string;
  medicineId: string;
  currentStock: number;
  reorderLevel: number;
  unit: string;
  batchNumber?: string | null;
  expiryDate?: string | null;
  lastUpdatedAt: string;
  medicine?: Medicine;
}

export interface StockTransaction {
  id: string;
  facilityId: string;
  medicineId: string;
  type: StockTransactionType;
  quantity: number;
  balanceAfter: number;
  batchNumber?: string | null;
  expiryDate?: string | null;
  supplier?: string | null;
  referenceNumber?: string | null;
  idempotencyKey?: string | null;
  notes?: string | null;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ambulance & Emergency
// ─────────────────────────────────────────────────────────────────────────────

export interface Ambulance {
  id: string;
  vehicleNumber: string;
  operatorId: string;
  currentFacilityId?: string | null;
  isActive: boolean;
  currentFacility?: Facility;
}

export interface EmergencyTransport {
  id: string;
  ambulanceId: string;
  patientId?: string | null;
  receivingFacilityId: string;
  emergencyDetails?: string | null;
  status: TransportStatus;
  dispatchedAt: string;
  arrivedAt?: string | null;
  completedAt?: string | null;
  ambulance?: Ambulance;
  patient?: Patient;
  receivingFacility?: Facility;
}

export interface DispatchAmbulanceDto {
  ambulanceId: string;
  patientId?: string;
  receivingFacilityId: string;
  emergencyDetails?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sync & Offline (D3)
// ─────────────────────────────────────────────────────────────────────────────

export interface SyncPullQuery {
  facilityId: string;
  since?: string;
}

export interface SyncPullResponse {
  timestamp: string;
  facilities: Facility[];
  doctors: Doctor[];
  beds: Bed[];
  equipment: Equipment[];
  medicineStocks: MedicineStock[];
  referrals: Referral[];
  appointments: Appointment[];
}

export interface SyncMutationItem {
  id: string;
  entity: 'REFERRAL' | 'APPOINTMENT' | 'BED' | 'EQUIPMENT' | 'STOCK_TRANSACTION';
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: Record<string, unknown>;
  clientTimestamp: string;
  idempotencyKey: string;
}

export interface SyncPushRequest {
  facilityId: string;
  mutations: SyncMutationItem[];
}

export interface SyncPushResponse {
  processedCount: number;
  successCount: number;
  failedCount: number;
  results: Array<{
    id: string;
    idempotencyKey: string;
    status: 'SUCCESS' | 'CONFLICT' | 'FAILED';
    error?: string;
  }>;
}
