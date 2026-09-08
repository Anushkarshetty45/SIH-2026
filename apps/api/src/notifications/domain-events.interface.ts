export enum DomainEventType {
  REFERRAL_CREATED = 'referral.created',
  REFERRAL_APPROVED = 'referral.approved',
  REFERRAL_REJECTED = 'referral.rejected',
  REFERRAL_TIMED_OUT = 'referral.timed_out',
  REFERRAL_CANCELLED = 'referral.cancelled',

  APPOINTMENT_BOOKED = 'appointment.booked',
  APPOINTMENT_CANCELLED = 'appointment.cancelled',
  APPOINTMENT_CONFIRMED = 'appointment.confirmed',

  AMBULANCE_DISPATCHED = 'ambulance.dispatched',
  AMBULANCE_ARRIVED = 'ambulance.arrived',
  AMBULANCE_COMPLETED = 'ambulance.completed',

  PATIENT_REGISTERED = 'patient.registered',
  CONSENT_GRANTED = 'consent.granted',
  CONSENT_REVOKED = 'consent.revoked',

  // D2 Operational Freshness & Escalation Events
  AVAILABILITY_STALE = 'availability.stale',
  BEDS_STALE = 'beds.stale',
  EQUIPMENT_STALE = 'equipment.stale',
  INVENTORY_STALE = 'inventory.stale',
  ESCALATION_TRIGGERED = 'escalation.triggered',
}

export interface DomainEvent<T = any> {
  type: DomainEventType;
  payload: T;
  occurredAt: Date;
  actorId?: string | null;
}

export interface ReferralEventPayload {
  referralId: string;
  patientId: string;
  fromFacilityId: string;
  toFacilityId: string;
  receivingDoctorId?: string;
  urgency: string;
}

export interface AppointmentEventPayload {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  facilityId: string;
  slotId: string;
}

export interface AmbulanceEventPayload {
  transportId: string;
  ambulanceId: string;
  patientId?: string;
  receivingFacilityId: string;
}

export interface StaleResourceEventPayload {
  resourceType: 'BEDS' | 'EQUIPMENT' | 'INVENTORY';
  facilityId: string;
  facilityName: string;
  district: string;
  staleForMinutes: number;
  thresholdMinutes: number;
  contactPhone?: string | null;
  hasLifeCriticalItems?: boolean;
  itemCount?: number;
}

export interface EscalationTriggeredEventPayload {
  escalationId: string;
  facilityId: string;
  facilityName: string;
  district: string;
  tier: 'TIER_1_FACILITY_ADMIN' | 'TIER_2_DISTRICT_AUTHORITY';
  resourceTypes: ('BEDS' | 'EQUIPMENT' | 'INVENTORY')[];
  maxStaleMinutes: number;
  contactPhone?: string | null;
  adminContact?: {
    id: string;
    name: string;
    phone: string | null;
    email: string;
  } | null;
}
