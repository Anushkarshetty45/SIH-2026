/*
  Warnings:

  - Added the required column `passwordHash` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Language" AS ENUM ('MARATHI', 'HINDI', 'ENGLISH');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('PENDING', 'GRANTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING_DOCTOR_APPROVAL', 'APPROVED', 'REJECTED', 'TIMED_OUT', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- CreateEnum
CREATE TYPE "TransportStatus" AS ENUM ('DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'COMPLETED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'FACILITY_STAFF';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD COLUMN     "preferredLanguage" "Language" NOT NULL DEFAULT 'MARATHI',
ADD COLUMN     "refreshTokenHash" TEXT;

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "district" TEXT,
    "state" TEXT,
    "abhaId" TEXT,
    "preferredLanguage" "Language" NOT NULL DEFAULT 'MARATHI',
    "consentStatus" "ConsentStatus" NOT NULL DEFAULT 'PENDING',
    "registeredById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'PENDING',
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_schedules" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDurationMinutes" INTEGER NOT NULL DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_slots" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" "SlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "referralId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "fromFacilityId" TEXT NOT NULL,
    "toFacilityId" TEXT NOT NULL,
    "receivingDoctorId" TEXT,
    "respondingDoctorId" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING_DOCTOR_APPROVAL',
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "clinicalNotes" TEXT,
    "rejectionReason" TEXT,
    "timeoutAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambulances" (
    "id" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "currentFacilityId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambulances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_transports" (
    "id" TEXT NOT NULL,
    "ambulanceId" TEXT NOT NULL,
    "patientId" TEXT,
    "receivingFacilityId" TEXT NOT NULL,
    "emergencyDetails" TEXT,
    "status" "TransportStatus" NOT NULL DEFAULT 'DISPATCHED',
    "dispatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "arrivedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_transports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patients_abhaId_key" ON "patients"("abhaId");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_schedules_doctorId_facilityId_dayOfWeek_key" ON "doctor_schedules"("doctorId", "facilityId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "appointment_slots_doctorId_date_status_idx" ON "appointment_slots"("doctorId", "date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_slots_doctorId_date_startTime_key" ON "appointment_slots"("doctorId", "date", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_slotId_key" ON "appointments"("slotId");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_referralId_key" ON "appointments"("referralId");

-- CreateIndex
CREATE INDEX "referrals_status_timeoutAt_idx" ON "referrals"("status", "timeoutAt");

-- CreateIndex
CREATE INDEX "referrals_patientId_idx" ON "referrals"("patientId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ambulances_vehicleNumber_key" ON "ambulances"("vehicleNumber");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_schedules" ADD CONSTRAINT "doctor_schedules_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_slots" ADD CONSTRAINT "appointment_slots_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "appointment_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "referrals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_fromFacilityId_fkey" FOREIGN KEY ("fromFacilityId") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_toFacilityId_fkey" FOREIGN KEY ("toFacilityId") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_receivingDoctorId_fkey" FOREIGN KEY ("receivingDoctorId") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_respondingDoctorId_fkey" FOREIGN KEY ("respondingDoctorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambulances" ADD CONSTRAINT "ambulances_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambulances" ADD CONSTRAINT "ambulances_currentFacilityId_fkey" FOREIGN KEY ("currentFacilityId") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_transports" ADD CONSTRAINT "emergency_transports_ambulanceId_fkey" FOREIGN KEY ("ambulanceId") REFERENCES "ambulances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_transports" ADD CONSTRAINT "emergency_transports_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_transports" ADD CONSTRAINT "emergency_transports_receivingFacilityId_fkey" FOREIGN KEY ("receivingFacilityId") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
