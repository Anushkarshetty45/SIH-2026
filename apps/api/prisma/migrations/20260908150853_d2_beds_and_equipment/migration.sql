-- CreateEnum
CREATE TYPE "BedCategory" AS ENUM ('GENERAL', 'ICU', 'OXYGEN', 'VENTILATOR', 'MATERNITY', 'PEDIATRIC');

-- CreateEnum
CREATE TYPE "BedStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('OPERATIONAL', 'UNDER_MAINTENANCE', 'DEFECTIVE', 'UNAVAILABLE');

-- CreateTable
CREATE TABLE "beds" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "bedNumber" TEXT NOT NULL,
    "ward" TEXT NOT NULL,
    "category" "BedCategory" NOT NULL DEFAULT 'GENERAL',
    "status" "BedStatus" NOT NULL DEFAULT 'AVAILABLE',
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "totalQuantity" INTEGER NOT NULL DEFAULT 1,
    "availableQuantity" INTEGER NOT NULL DEFAULT 1,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "beds_facilityId_status_idx" ON "beds"("facilityId", "status");

-- CreateIndex
CREATE INDEX "beds_facilityId_category_idx" ON "beds"("facilityId", "category");

-- CreateIndex
CREATE INDEX "beds_lastUpdatedAt_idx" ON "beds"("lastUpdatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "beds_facilityId_bedNumber_key" ON "beds"("facilityId", "bedNumber");

-- CreateIndex
CREATE INDEX "equipment_facilityId_status_idx" ON "equipment"("facilityId", "status");

-- CreateIndex
CREATE INDEX "equipment_lastUpdatedAt_idx" ON "equipment"("lastUpdatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_facilityId_name_key" ON "equipment"("facilityId", "name");

-- AddForeignKey
ALTER TABLE "beds" ADD CONSTRAINT "beds_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beds" ADD CONSTRAINT "beds_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
