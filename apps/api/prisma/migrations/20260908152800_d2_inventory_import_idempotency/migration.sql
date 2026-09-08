-- AlterTable
ALTER TABLE "stock_transactions" ADD COLUMN     "idempotencyKey" TEXT;

-- CreateTable
CREATE TABLE "inventory_import_batches" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "successfulRows" INTEGER NOT NULL,
    "failedRows" INTEGER NOT NULL,
    "errors" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_import_batches_facilityId_idx" ON "inventory_import_batches"("facilityId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_import_batches_facilityId_idempotencyKey_key" ON "inventory_import_batches"("facilityId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "stock_transactions_facilityId_idempotencyKey_key" ON "stock_transactions"("facilityId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "inventory_import_batches" ADD CONSTRAINT "inventory_import_batches_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
