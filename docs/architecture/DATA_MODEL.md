# Data Model Specification

Canonical data model for the Rural Healthcare Coordination Platform (CareGrid) PostgreSQL database managed with Prisma ORM.

## Entity Relationship Summary

```
User (Role: ASHA_WORKER, PHC_STAFF, DOCTOR, FACILITY_STAFF, HOSPITAL_ADMIN, AMBULANCE_STAFF, SUPER_ADMIN)
  ├── Doctor (1:1 with User)
  │     ├── DoctorSchedule (1:N)
  │     ├── AppointmentSlot (1:N)
  │     └── Appointment (1:N)
  ├── Facility (1:1 Admin)
  │     ├── Doctors (1:N)
  │     ├── Ambulances (1:N)
  │     └── Appointments (1:N)
  ├── Patient (Registered by User)
  │     ├── Consents (1:N)
  │     ├── Appointments (1:N)
  │     ├── Referrals (1:N)
  │     └── EmergencyTransports (1:N)
  └── AuditLog (Actor trail)
```

---

## Enums

### `UserRole`
- `SUPER_ADMIN`: System-wide administration
- `HOSPITAL_ADMIN`: Facility-level management
- `DOCTOR`: Healthcare provider providing consultations
- `FACILITY_STAFF`: Desk staff booking slots and admitting patients
- `PHC_STAFF`: Primary Health Centre staff coordinating care
- `ASHA_WORKER`: Accredited Social Health Activist conducting field visits
- `AMBULANCE_STAFF`: Driver/paramedic on emergency transport duty

### `Language`
- `MARATHI` (default)
- `HINDI`
- `ENGLISH`

### `FacilityType`
- `PHC`: Primary Health Centre
- `CHC`: Community Health Centre
- `DISTRICT_HOSPITAL`: District Hospital
- `CITY_HOSPITAL`: Tertiary City Hospital
- `PRIVATE_CLINIC`: Empaneled Clinic

### `FacilityStatus`
- `ACTIVE`
- `INACTIVE`

### `ConsentStatus`
- `PENDING`
- `GRANTED`
- `REVOKED`

### `ReferralStatus`
- `PENDING_DOCTOR_APPROVAL`: Initial state upon creation; auto-times out in 30 minutes
- `APPROVED`: Accepted by receiving doctor
- `REJECTED`: Rejected by receiving doctor with clinical rationale
- `TIMED_OUT`: Expired after 30 minutes with no doctor response (triggers escalation)
- `CANCELLED`: Cancelled by sender
- `COMPLETED`: Patient evaluated at destination facility

### `AppointmentStatus`
- `SCHEDULED`: Reserved slot
- `CONFIRMED`: Patient arrival confirmed
- `COMPLETED`: Visit concluded
- `CANCELLED`: Appointment cancelled (releases slot back to AVAILABLE)
- `NO_SHOW`: Patient did not attend

### `SlotStatus`
- `AVAILABLE`: Ready to be booked
- `BOOKED`: Assigned to an active appointment
- `BLOCKED`: Unavailable due to doctor leave / facility emergency

### `DayOfWeek`
- `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`, `SUN`

### `TransportStatus`
- `DISPATCHED`: Ambulance assigned to emergency
- `EN_ROUTE`: Vehicle in transit to patient
- `ARRIVED`: Vehicle arrived on scene
- `COMPLETED`: Patient delivered to receiving facility
- `CANCELLED`: Transport cancelled

---

## Core Models

### `User` (`users`)
- `id` (String, PK)
- `email` (String, Unique)
- `phone` (String?, Unique)
- `passwordHash` (String)
- `name` (String)
- `role` (UserRole)
- `preferredLanguage` (Language)
- `refreshTokenHash` (String?)
- `isActive` (Boolean)
- `createdAt`, `updatedAt`

### `Facility` (`facilities`)
- `id` (String, PK)
- `name` (String)
- `type` (FacilityType)
- `status` (FacilityStatus)
- `address`, `district`, `state`, `pincode` (String)
- `latitude`, `longitude` (Float?)
- `contactPhone` (String?)
- `adminId` (String?, 1:1 with User)
- `lastUpdatedAt`, `createdAt`

### `Doctor` (`doctors`)
- `id` (String, PK)
- `userId` (String, Unique, FK User)
- `facilityId` (String, FK Facility)
- `specialization` (String)
- `registrationNo` (String, Unique)
- `isAvailable` (Boolean)
- `createdAt`, `updatedAt`

### `DoctorSchedule` (`doctor_schedules`)
- `id` (String, PK)
- `doctorId` (String, FK Doctor)
- `facilityId` (String)
- `dayOfWeek` (DayOfWeek)
- `startTime`, `endTime` (String)
- `slotDurationMinutes` (Int, default 15)
- `isActive` (Boolean)
- `createdAt`, `updatedAt`
- Unique: `[doctorId, facilityId, dayOfWeek]`

### `AppointmentSlot` (`appointment_slots`)
- `id` (String, PK)
- `doctorId` (String, FK Doctor)
- `facilityId` (String)
- `date` (DateTime, Date-only)
- `startTime`, `endTime` (String)
- `status` (SlotStatus: AVAILABLE, BOOKED, BLOCKED)
- `createdAt`, `updatedAt`
- Unique: `[doctorId, date, startTime]`

### `Patient` (`patients`)
- `id` (String, PK)
- `name` (String)
- `dateOfBirth` (DateTime?)
- `gender` (String?)
- `phone` (String?)
- `address`, `district`, `state` (String?)
- `abhaId` (String?, Unique — ABHA is strictly optional)
- `preferredLanguage` (Language, default MARATHI)
- `consentStatus` (ConsentStatus, default PENDING)
- `registeredById` (String?, FK User)
- `createdAt`, `updatedAt`

### `Consent` (`consents`)
- `id` (String, PK)
- `patientId` (String, FK Patient)
- `purpose` (String)
- `status` (ConsentStatus)
- `grantedAt`, `revokedAt`, `expiresAt` (DateTime?)
- `metadata` (Json?)
- `createdAt`, `updatedAt`

### `Referral` (`referrals`)
- `id` (String, PK)
- `patientId` (String, FK Patient)
- `createdById` (String, FK User)
- `fromFacilityId` (String, FK Facility)
- `toFacilityId` (String, FK Facility)
- `receivingDoctorId` (String?, FK Doctor)
- `respondingDoctorId` (String?, FK User)
- `status` (ReferralStatus)
- `urgency` (String, default "NORMAL")
- `clinicalNotes` (String?)
- `rejectionReason` (String?)
- `timeoutAt` (DateTime?, default now + 30m)
- `respondedAt` (DateTime?)
- `createdAt`, `updatedAt`

### `Appointment` (`appointments`)
- `id` (String, PK)
- `patientId` (String, FK Patient)
- `doctorId` (String, FK Doctor)
- `facilityId` (String, FK Facility)
- `slotId` (String, Unique, FK AppointmentSlot)
- `status` (AppointmentStatus)
- `notes` (String?)
- `referralId` (String?, Unique, FK Referral)
- `createdAt`, `updatedAt`

### `Ambulance` (`ambulances`)
- `id` (String, PK)
- `vehicleNumber` (String, Unique)
- `operatorId` (String, FK User)
- `currentFacilityId` (String?, FK Facility)
- `isActive` (Boolean)
- `createdAt`, `updatedAt`

### `EmergencyTransport` (`emergency_transports`)
- `id` (String, PK)
- `ambulanceId` (String, FK Ambulance)
- `patientId` (String?, FK Patient)
- `receivingFacilityId` (String, FK Facility)
- `emergencyDetails` (String?)
- `status` (TransportStatus)
- `dispatchedAt`, `arrivedAt`, `completedAt` (DateTime?)
- `createdAt`, `updatedAt`

### `AuditLog` (`audit_logs`)
- `id` (String, PK)
- `actorId` (String?, FK User)
- `action` (String)
- `entity` (String)
- `entityId` (String)
- `metadata` (Json?)
- `ipAddress` (String?)
- `createdAt` (DateTime)

---

## Concurrency Guarantee
Appointment booking leverages transactional isolation with pessimistic row-level locking (`SELECT ... FOR UPDATE`) on the `AppointmentSlot` row combined with an immediate status transition to `BOOKED` and a unique constraint on `Appointment.slotId`. This prevents double-booking even under concurrent load.
