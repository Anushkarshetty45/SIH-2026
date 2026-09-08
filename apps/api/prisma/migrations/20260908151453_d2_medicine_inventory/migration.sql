-- CreateEnum
CREATE TYPE "StockTransactionType" AS ENUM ('RECEIPT', 'ISSUE', 'ADJUSTMENT', 'CORRECTION');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK');

-- CreateTable
CREATE TABLE "medicines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genericName" TEXT NOT NULL,
    "dosageForm" TEXT NOT NULL,
    "strength" TEXT NOT NULL,
    "category" TEXT,
    "manufacturer" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'tablets',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine_alternatives" (
    "id" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "alternativeMedicineId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicine_alternatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine_stocks" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 10,
    "unit" TEXT NOT NULL DEFAULT 'units',
    "batchNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicine_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transactions" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "stockId" TEXT,
    "medicineId" TEXT NOT NULL,
    "type" "StockTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "batchNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "supplier" TEXT,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medicines_genericName_idx" ON "medicines"("genericName");

-- CreateIndex
CREATE INDEX "medicines_name_idx" ON "medicines"("name");

-- CreateIndex
CREATE UNIQUE INDEX "medicines_name_strength_dosageForm_key" ON "medicines"("name", "strength", "dosageForm");

-- CreateIndex
CREATE INDEX "medicine_alternatives_medicineId_idx" ON "medicine_alternatives"("medicineId");

-- CreateIndex
CREATE INDEX "medicine_alternatives_alternativeMedicineId_idx" ON "medicine_alternatives"("alternativeMedicineId");

-- CreateIndex
CREATE UNIQUE INDEX "medicine_alternatives_medicineId_alternativeMedicineId_key" ON "medicine_alternatives"("medicineId", "alternativeMedicineId");

-- CreateIndex
CREATE INDEX "medicine_stocks_facilityId_idx" ON "medicine_stocks"("facilityId");

-- CreateIndex
CREATE INDEX "medicine_stocks_medicineId_idx" ON "medicine_stocks"("medicineId");

-- CreateIndex
CREATE INDEX "medicine_stocks_lastUpdatedAt_idx" ON "medicine_stocks"("lastUpdatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "medicine_stocks_facilityId_medicineId_key" ON "medicine_stocks"("facilityId", "medicineId");

-- CreateIndex
CREATE INDEX "stock_transactions_facilityId_medicineId_idx" ON "stock_transactions"("facilityId", "medicineId");

-- CreateIndex
CREATE INDEX "stock_transactions_facilityId_createdAt_idx" ON "stock_transactions"("facilityId", "createdAt");

-- CreateIndex
CREATE INDEX "stock_transactions_createdAt_idx" ON "stock_transactions"("createdAt");

-- AddForeignKey
ALTER TABLE "medicine_alternatives" ADD CONSTRAINT "medicine_alternatives_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "medicines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_alternatives" ADD CONSTRAINT "medicine_alternatives_alternativeMedicineId_fkey" FOREIGN KEY ("alternativeMedicineId") REFERENCES "medicines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_stocks" ADD CONSTRAINT "medicine_stocks_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_stocks" ADD CONSTRAINT "medicine_stocks_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "medicines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_stocks" ADD CONSTRAINT "medicine_stocks_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "medicine_stocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "medicines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Negative stock protection check constraint
ALTER TABLE "medicine_stocks" ADD CONSTRAINT "medicine_stocks_currentStock_check" CHECK ("currentStock" >= 0);

