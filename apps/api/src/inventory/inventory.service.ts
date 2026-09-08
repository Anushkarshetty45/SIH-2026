import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  StockIntakeDto,
  StockAdjustmentDto,
  InventoryQueryDto,
  StaleInventoryQueryDto,
  StockStatus,
  PrescriptionAvailabilityCheckDto,
  ImportInventoryDto,
} from './dto/inventory.dto';
import { StockTransactionType, Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  private readonly defaultStaleThresholdMinutes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.defaultStaleThresholdMinutes =
      this.configService.get<number>('app.staleThresholds.inventoryMinutes', 120) || 120;
  }

  /**
   * Concurrency-safe stock intake (Receipt)
   */
  async recordIntake(dto: StockIntakeDto, userId?: string) {
    // 1. Verify facility exists
    // 0. Idempotency check for safe retries over 2G
    if (dto.idempotencyKey) {
      const existingTx = await this.prisma.stockTransaction.findUnique({
        where: {
          facilityId_idempotencyKey: {
            facilityId: dto.facilityId,
            idempotencyKey: dto.idempotencyKey,
          },
        },
        include: { stock: true },
      });
      if (existingTx) {
        return {
          stock: existingTx.stock,
          transaction: existingTx,
          idempotentReplay: true,
          message: `Stock intake already recorded (idempotent replay). Balance: ${existingTx.balanceAfter}`,
        };
      }
    }

    // 1. Verify facility exists
    const facility = await this.prisma.facility.findUnique({
      where: { id: dto.facilityId },
    });
    if (!facility) {
      throw new NotFoundException(`Facility with ID ${dto.facilityId} not found`);
    }

    // 2. Verify medicine exists
    const medicine = await this.prisma.medicine.findUnique({
      where: { id: dto.medicineId },
    });
    if (!medicine) {
      throw new NotFoundException(`Medicine with ID ${dto.medicineId} not found`);
    }

    const now = new Date();
    const expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;

    // 3. Execute in interactive Prisma transaction for atomicity and concurrency safety
    return await this.prisma.$transaction(async (tx) => {
      // Upsert the stock record atomically
      const stock = await tx.medicineStock.upsert({
        where: {
          facilityId_medicineId: {
            facilityId: dto.facilityId,
            medicineId: dto.medicineId,
          },
        },
        create: {
          facilityId: dto.facilityId,
          medicineId: dto.medicineId,
          currentStock: dto.quantity,
          unit: dto.unit?.trim() || medicine.unit,
          batchNumber: dto.batchNumber?.trim(),
          expiryDate,
          lastUpdatedAt: now,
          updatedById: userId,
        },
        update: {
          currentStock: { increment: dto.quantity },
          unit: dto.unit?.trim() || medicine.unit,
          batchNumber: dto.batchNumber?.trim() || undefined,
          expiryDate: expiryDate || undefined,
          lastUpdatedAt: now,
          updatedById: userId,
        },
      });

      // Record transaction
      const transaction = await tx.stockTransaction.create({
        data: {
          facilityId: dto.facilityId,
          stockId: stock.id,
          medicineId: dto.medicineId,
          type: StockTransactionType.RECEIPT,
          quantity: dto.quantity,
          balanceAfter: stock.currentStock,
          batchNumber: dto.batchNumber?.trim(),
          expiryDate,
          supplier: dto.supplier?.trim(),
          referenceNumber: dto.referenceNumber?.trim(),
          idempotencyKey: dto.idempotencyKey?.trim(),
          notes: dto.notes?.trim(),
          createdById: userId,
          createdAt: now,
        },
      });

      return {
        stock,
        transaction,
        idempotentReplay: false,
        message: `Successfully received ${dto.quantity} ${stock.unit} of ${medicine.name}. New balance: ${stock.currentStock}`,
      };
    });
  }

  /**
   * Concurrency-safe stock adjustment with negative-stock prevention
   */
  async adjustStock(dto: StockAdjustmentDto, userId?: string) {
    const now = new Date();

    return await this.prisma.$transaction(async (tx) => {
      // 1. Fetch current stock
      const stock = await tx.medicineStock.findUnique({
        where: {
          facilityId_medicineId: {
            facilityId: dto.facilityId,
            medicineId: dto.medicineId,
          },
        },
        include: { medicine: true },
      });

      if (!stock) {
        if (dto.type === StockTransactionType.RECEIPT) {
          // If receiving stock for a new item, delegate to intake logic
          const medicine = await tx.medicine.findUnique({
            where: { id: dto.medicineId },
          });
          if (!medicine) {
            throw new NotFoundException(`Medicine ${dto.medicineId} not found`);
          }

          const newStock = await tx.medicineStock.create({
            data: {
              facilityId: dto.facilityId,
              medicineId: dto.medicineId,
              currentStock: dto.quantity,
              unit: medicine.unit,
              batchNumber: dto.batchNumber?.trim(),
              lastUpdatedAt: now,
              updatedById: userId,
            },
          });

          const transaction = await tx.stockTransaction.create({
            data: {
              facilityId: dto.facilityId,
              stockId: newStock.id,
              medicineId: dto.medicineId,
              type: StockTransactionType.RECEIPT,
              quantity: dto.quantity,
              balanceAfter: newStock.currentStock,
              batchNumber: dto.batchNumber?.trim(),
              referenceNumber: dto.referenceNumber?.trim(),
              notes: dto.notes?.trim(),
              createdById: userId,
              createdAt: now,
            },
          });

          return { stock: newStock, transaction };
        }

        throw new NotFoundException(
          `No stock record found for medicine ${dto.medicineId} at facility ${dto.facilityId}`,
        );
      }

      let updatedStock;
      let transactionDelta: number;

      if (dto.type === StockTransactionType.ISSUE) {
        if (dto.quantity <= 0) {
          throw new BadRequestException('Issue quantity must be greater than 0');
        }

        // Negative-stock check
        if (stock.currentStock < dto.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${stock.medicine.name}. Current stock: ${stock.currentStock}, requested issue: ${dto.quantity}`,
          );
        }

        // Atomic decrement
        updatedStock = await tx.medicineStock.update({
          where: { id: stock.id },
          data: {
            currentStock: { decrement: dto.quantity },
            lastUpdatedAt: now,
            updatedById: userId,
          },
        });

        // Invariant assertion (further guaranteed by DB check constraint)
        if (updatedStock.currentStock < 0) {
          throw new BadRequestException('Operation failed: Stock cannot become negative');
        }

        transactionDelta = -dto.quantity;
      } else if (dto.type === StockTransactionType.RECEIPT) {
        if (dto.quantity <= 0) {
          throw new BadRequestException('Receipt quantity must be greater than 0');
        }

        updatedStock = await tx.medicineStock.update({
          where: { id: stock.id },
          data: {
            currentStock: { increment: dto.quantity },
            lastUpdatedAt: now,
            updatedById: userId,
          },
        });

        transactionDelta = dto.quantity;
      } else if (
        dto.type === StockTransactionType.ADJUSTMENT ||
        dto.type === StockTransactionType.CORRECTION
      ) {
        // Physical count sync / correction: dto.quantity represents the verified physical count
        if (dto.quantity < 0) {
          throw new BadRequestException('Stock quantity cannot be negative');
        }

        transactionDelta = dto.quantity - stock.currentStock;

        updatedStock = await tx.medicineStock.update({
          where: { id: stock.id },
          data: {
            currentStock: dto.quantity,
            lastUpdatedAt: now,
            updatedById: userId,
          },
        });
      } else {
        throw new BadRequestException(`Unsupported transaction type: ${dto.type}`);
      }

      // Record transaction
      const transaction = await tx.stockTransaction.create({
        data: {
          facilityId: dto.facilityId,
          stockId: stock.id,
          medicineId: dto.medicineId,
          type: dto.type,
          quantity: transactionDelta,
          balanceAfter: updatedStock.currentStock,
          batchNumber: dto.batchNumber?.trim() || stock.batchNumber,
          referenceNumber: dto.referenceNumber?.trim(),
          notes: dto.notes?.trim(),
          createdById: userId,
          createdAt: now,
        },
      });

      return {
        stock: updatedStock,
        transaction,
        message: `Stock updated for ${stock.medicine.name}. New balance: ${updatedStock.currentStock}`,
      };
    });
  }

  /**
   * Fast prescription-time medicine availability check with deterministic alternatives
   */
  async checkAvailability(facilityId: string, medicineId: string) {
    const thresholdMinutes = this.defaultStaleThresholdMinutes;

    // 1. Fetch medicine
    const medicine = await this.prisma.medicine.findUnique({
      where: { id: medicineId },
    });
    if (!medicine) {
      throw new NotFoundException(`Medicine with ID ${medicineId} not found`);
    }

    // 2. Fetch stock at this facility
    const stock = await this.prisma.medicineStock.findUnique({
      where: {
        facilityId_medicineId: {
          facilityId,
          medicineId,
        },
      },
    });

    const currentStock = stock ? stock.currentStock : 0;
    const reorderLevel = stock ? stock.reorderLevel : 10;
    const unit = stock?.unit || medicine.unit;

    let status: StockStatus;
    if (currentStock <= 0) {
      status = StockStatus.OUT_OF_STOCK;
    } else if (currentStock <= reorderLevel) {
      status = StockStatus.LOW_STOCK;
    } else {
      status = StockStatus.AVAILABLE;
    }

    let isStale = false;
    let ageMinutes: number | null = null;
    let lastUpdatedAt: Date | null = null;

    if (stock) {
      lastUpdatedAt = stock.lastUpdatedAt;
      ageMinutes = Math.floor((Date.now() - stock.lastUpdatedAt.getTime()) / (1000 * 60));
      isStale = ageMinutes > thresholdMinutes;
    }

    // 3. Find deterministic alternatives at the same facility
    const alternatives: any[] = [];

    // Query explicit controlled mappings
    const explicitMappings = await this.prisma.medicineAlternative.findMany({
      where: { medicineId },
      include: {
        alternativeMedicine: {
          include: {
            Stocks: {
              where: { facilityId },
            },
          },
        },
      },
    });

    for (const mapping of explicitMappings) {
      const altMed = mapping.alternativeMedicine;
      const altStock = altMed.Stocks[0];
      const altQty = altStock ? altStock.currentStock : 0;
      const altReorder = altStock ? altStock.reorderLevel : 10;

      let altStatus: StockStatus;
      if (altQty <= 0) altStatus = StockStatus.OUT_OF_STOCK;
      else if (altQty <= altReorder) altStatus = StockStatus.LOW_STOCK;
      else altStatus = StockStatus.AVAILABLE;

      const altAge = altStock
        ? Math.floor((Date.now() - altStock.lastUpdatedAt.getTime()) / (1000 * 60))
        : null;

      alternatives.push({
        medicineId: altMed.id,
        name: altMed.name,
        genericName: altMed.genericName,
        strength: altMed.strength,
        dosageForm: altMed.dosageForm,
        currentStock: altQty,
        unit: altStock?.unit || altMed.unit,
        status: altStatus,
        isStale: altAge !== null ? altAge > thresholdMinutes : true,
        ageMinutes: altAge,
        mappingType: 'CONTROLLED_MAPPING',
        notes: mapping.notes,
      });
    }

    // Query generic equivalents if none found or to provide comprehensive options
    const mappedIds = new Set(alternatives.map((a) => a.medicineId));
    const genericMatches = await this.prisma.medicine.findMany({
      where: {
        id: { not: medicineId, notIn: Array.from(mappedIds) },
        genericName: { equals: medicine.genericName, mode: 'insensitive' },
        strength: { equals: medicine.strength, mode: 'insensitive' },
        dosageForm: { equals: medicine.dosageForm, mode: 'insensitive' },
        isActive: true,
      },
      include: {
        Stocks: {
          where: { facilityId },
        },
      },
    });

    for (const gen of genericMatches) {
      const genStock = gen.Stocks[0];
      const genQty = genStock ? genStock.currentStock : 0;
      const genReorder = genStock ? genStock.reorderLevel : 10;

      let genStatus: StockStatus;
      if (genQty <= 0) genStatus = StockStatus.OUT_OF_STOCK;
      else if (genQty <= genReorder) genStatus = StockStatus.LOW_STOCK;
      else genStatus = StockStatus.AVAILABLE;

      const genAge = genStock
        ? Math.floor((Date.now() - genStock.lastUpdatedAt.getTime()) / (1000 * 60))
        : null;

      alternatives.push({
        medicineId: gen.id,
        name: gen.name,
        genericName: gen.genericName,
        strength: gen.strength,
        dosageForm: gen.dosageForm,
        currentStock: genQty,
        unit: genStock?.unit || gen.unit,
        status: genStatus,
        isStale: genAge !== null ? genAge > thresholdMinutes : true,
        ageMinutes: genAge,
        mappingType: 'GENERIC_EQUIVALENT',
        notes: 'Identical generic molecule, strength, and dosage form',
      });
    }

    return {
      facilityId,
      medicineId,
      medicineName: medicine.name,
      genericName: medicine.genericName,
      strength: medicine.strength,
      dosageForm: medicine.dosageForm,
      currentStock,
      unit,
      status,
      lastUpdatedAt,
      isStale,
      ageMinutes,
      staleThresholdMinutes: thresholdMinutes,
      clinicalNote:
        'Alternative medicines are deterministic reference suggestions. The prescribing clinician must evaluate clinical appropriateness.',
      alternatives,
    };
  }

  /**
   * Facility inventory summary & paginated listing
   */
  async getFacilityInventory(facilityId: string, query: InventoryQueryDto) {
    const facility = await this.prisma.facility.findUnique({
      where: { id: facilityId },
    });
    if (!facility) {
      throw new NotFoundException(`Facility with ID ${facilityId} not found`);
    }

    const thresholdMinutes = this.defaultStaleThresholdMinutes;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.MedicineStockWhereInput = {
      facilityId,
    };

    if (query.search) {
      where.medicine = {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { genericName: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    if (query.status === StockStatus.OUT_OF_STOCK) {
      where.currentStock = { lte: 0 };
    } else if (query.status === StockStatus.AVAILABLE) {
      where.currentStock = { gt: 10 };
    }

    const [stocks, total, allStocksForFacility] = await Promise.all([
      this.prisma.medicineStock.findMany({
        where,
        include: {
          medicine: true,
        },
        skip,
        take: limit,
        orderBy: [{ medicine: { name: 'asc' } }],
      }),
      this.prisma.medicineStock.count({ where }),
      this.prisma.medicineStock.findMany({
        where: { facilityId },
        select: { currentStock: true, reorderLevel: true, lastUpdatedAt: true },
      }),
    ]);

    // Aggregate facility inventory stats
    let availableCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let staleCount = 0;
    let latestUpdate: Date | null = null;

    const nowTime = Date.now();

    for (const item of allStocksForFacility) {
      if (item.currentStock <= 0) {
        outOfStockCount++;
      } else if (item.currentStock <= item.reorderLevel) {
        lowStockCount++;
      } else {
        availableCount++;
      }

      const age = Math.floor((nowTime - item.lastUpdatedAt.getTime()) / (1000 * 60));
      if (age > thresholdMinutes) {
        staleCount++;
      }

      if (!latestUpdate || item.lastUpdatedAt > latestUpdate) {
        latestUpdate = item.lastUpdatedAt;
      }
    }

    const facilityAgeMinutes = latestUpdate
      ? Math.floor((nowTime - latestUpdate.getTime()) / (1000 * 60))
      : null;

    const formattedItems = stocks.map((s) => {
      const age = Math.floor((nowTime - s.lastUpdatedAt.getTime()) / (1000 * 60));
      let status: StockStatus;
      if (s.currentStock <= 0) status = StockStatus.OUT_OF_STOCK;
      else if (s.currentStock <= s.reorderLevel) status = StockStatus.LOW_STOCK;
      else status = StockStatus.AVAILABLE;

      return {
        id: s.id,
        medicineId: s.medicineId,
        name: s.medicine.name,
        genericName: s.medicine.genericName,
        strength: s.medicine.strength,
        dosageForm: s.medicine.dosageForm,
        category: s.medicine.category,
        currentStock: s.currentStock,
        reorderLevel: s.reorderLevel,
        unit: s.unit,
        batchNumber: s.batchNumber,
        expiryDate: s.expiryDate,
        status,
        lastUpdatedAt: s.lastUpdatedAt,
        ageMinutes: age,
        isStale: age > thresholdMinutes,
      };
    });

    return {
      facilityId,
      facilityName: facility.name,
      district: facility.district,
      summary: {
        totalItems: allStocksForFacility.length,
        availableItems: availableCount,
        lowStockItems: lowStockCount,
        outOfStockItems: outOfStockCount,
        staleItems: staleCount,
        lastUpdatedAt: latestUpdate,
        ageMinutes: facilityAgeMinutes,
        isStale: facilityAgeMinutes !== null ? facilityAgeMinutes > thresholdMinutes : true,
      },
      items: formattedItems,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get stock of a specific medicine at a facility with recent transaction history
   */
  async getFacilityMedicineStock(facilityId: string, medicineId: string) {
    const stock = await this.prisma.medicineStock.findUnique({
      where: {
        facilityId_medicineId: {
          facilityId,
          medicineId,
        },
      },
      include: {
        medicine: true,
        Transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    if (!stock) {
      throw new NotFoundException(
        `Medicine ${medicineId} not registered in facility ${facilityId} inventory`,
      );
    }

    const ageMinutes = Math.floor((Date.now() - stock.lastUpdatedAt.getTime()) / (1000 * 60));

    return {
      ...stock,
      ageMinutes,
      isStale: ageMinutes > this.defaultStaleThresholdMinutes,
    };
  }

  /**
   * Stale Inventory Detection for D3 Scheduled Escalation
   */
  async getStaleInventory(query: StaleInventoryQueryDto) {
    const thresholdMinutes = query.thresholdMinutes || this.defaultStaleThresholdMinutes;
    const thresholdDate = new Date(Date.now() - thresholdMinutes * 60 * 1000);

    const where: Prisma.MedicineStockWhereInput = {
      lastUpdatedAt: {
        lt: thresholdDate,
      },
    };

    if (query.facilityId) {
      where.facilityId = query.facilityId;
    }

    if (query.district) {
      where.facility = {
        district: {
          contains: query.district,
          mode: 'insensitive',
        },
      };
    }

    const staleStocks = await this.prisma.medicineStock.findMany({
      where,
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            district: true,
            contactPhone: true,
          },
        },
        medicine: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { lastUpdatedAt: 'asc' },
    });

    // Group by facility for D3 escalation batches
    const groupedByFacility = new Map<string, any>();

    for (const stock of staleStocks) {
      const f = stock.facility;
      if (!groupedByFacility.has(f.id)) {
        groupedByFacility.set(f.id, {
          facilityId: f.id,
          facilityName: f.name,
          district: f.district,
          contactPhone: f.contactPhone,
          staleItemCount: 0,
          oldestUpdate: stock.lastUpdatedAt,
          staleMedicines: [],
        });
      }

      const group = groupedByFacility.get(f.id);
      group.staleItemCount++;
      if (stock.lastUpdatedAt < group.oldestUpdate) {
        group.oldestUpdate = stock.lastUpdatedAt;
      }
      group.staleMedicines.push({
        medicineId: stock.medicine.id,
        name: stock.medicine.name,
        currentStock: stock.currentStock,
        lastUpdatedAt: stock.lastUpdatedAt,
        ageMinutes: Math.floor((Date.now() - stock.lastUpdatedAt.getTime()) / (1000 * 60)),
      });
    }

    return {
      thresholdMinutes,
      thresholdDate,
      totalStaleStocks: staleStocks.length,
      affectedFacilitiesCount: groupedByFacility.size,
      facilities: Array.from(groupedByFacility.values()),
    };
  }

  /**
   * Prescription-time multi-item medicine availability check
   */
  async checkPrescriptionAvailability(dto: PrescriptionAvailabilityCheckDto) {
    const facility = await this.prisma.facility.findUnique({
      where: { id: dto.facilityId },
      select: { id: true, name: true, district: true },
    });
    if (!facility) {
      throw new NotFoundException(`Facility with ID ${dto.facilityId} not found`);
    }

    const results: any[] = [];
    let allAvailable = true;

    for (const item of dto.items) {
      const avail = await this.checkAvailability(dto.facilityId, item.medicineId);
      const canFulfill = avail.currentStock >= item.quantity;
      if (!canFulfill) {
        allAvailable = false;
      }

      results.push({
        medicineId: avail.medicineId,
        medicineName: avail.medicineName,
        genericName: avail.genericName,
        strength: avail.strength,
        dosageForm: avail.dosageForm,
        unit: avail.unit,
        requestedQuantity: item.quantity,
        currentStock: avail.currentStock,
        status: avail.status,
        canFulfill,
        isStale: avail.isStale,
        ageMinutes: avail.ageMinutes,
        lastUpdatedAt: avail.lastUpdatedAt,
        alternatives: avail.alternatives.map((alt) => ({
          ...alt,
          canFulfillAlternative: alt.currentStock >= item.quantity,
        })),
      });
    }

    return {
      facilityId: facility.id,
      facilityName: facility.name,
      district: facility.district,
      totalItemsRequested: dto.items.length,
      allAvailable,
      items: results,
      clinicalWarning:
        'Alternative medicines are deterministic reference suggestions. The prescribing clinician must evaluate clinical appropriateness. Alternative available does NOT mean automatic substitution.',
    };
  }

  /**
   * Structured inventory import with row-level error validation and 2G retry idempotency
   */
  async importInventory(dto: ImportInventoryDto, userId?: string) {
    const facility = await this.prisma.facility.findUnique({
      where: { id: dto.facilityId },
    });
    if (!facility) {
      throw new NotFoundException(`Facility with ID ${dto.facilityId} not found`);
    }

    // Idempotency check: if client retries with the same idempotencyKey, return previous summary
    if (dto.idempotencyKey) {
      const existingBatch = await this.prisma.inventoryImportBatch.findUnique({
        where: {
          facilityId_idempotencyKey: {
            facilityId: dto.facilityId,
            idempotencyKey: dto.idempotencyKey,
          },
        },
      });
      if (existingBatch) {
        return {
          facilityId: existingBatch.facilityId,
          idempotencyKey: existingBatch.idempotencyKey,
          idempotentReplay: true,
          totalRows: existingBatch.totalRows,
          successfulRows: existingBatch.successfulRows,
          failedRows: existingBatch.failedRows,
          errors: existingBatch.errors,
          message: 'Batch import already processed (idempotent replay)',
        };
      }
    }

    const rowErrors: Array<{ row: number; reason: string }> = [];
    let successfulRows = 0;
    let failedRows = 0;
    const now = new Date();

    for (const row of dto.rows) {
      try {
        if (!row.quantity || row.quantity <= 0) {
          rowErrors.push({
            row: row.rowNumber,
            reason: `Invalid quantity '${row.quantity}'. Must be an integer >= 1`,
          });
          failedRows++;
          continue;
        }

        // 1. Resolve medicine
        let medicine = null;
        if (row.medicineId) {
          medicine = await this.prisma.medicine.findUnique({
            where: { id: row.medicineId },
          });
        }

        if (!medicine && row.medicineName) {
          medicine = await this.prisma.medicine.findFirst({
            where: {
              name: { equals: row.medicineName.trim(), mode: 'insensitive' },
              ...(row.strength && {
                strength: { equals: row.strength.trim(), mode: 'insensitive' },
              }),
              ...(row.dosageForm && {
                dosageForm: { equals: row.dosageForm.trim(), mode: 'insensitive' },
              }),
            },
          });
        }

        if (!medicine) {
          rowErrors.push({
            row: row.rowNumber,
            reason: `Medicine '${row.medicineName || row.medicineId || 'Unspecified'}' not found in master catalog`,
          });
          failedRows++;
          continue;
        }

        const expiryDate = row.expiryDate ? new Date(row.expiryDate) : null;

        // Upsert stock and record transaction
        await this.prisma.$transaction(async (tx) => {
          const stock = await tx.medicineStock.upsert({
            where: {
              facilityId_medicineId: {
                facilityId: dto.facilityId,
                medicineId: medicine.id,
              },
            },
            create: {
              facilityId: dto.facilityId,
              medicineId: medicine.id,
              currentStock: row.quantity,
              unit: row.unit?.trim() || medicine.unit,
              batchNumber: row.batchNumber?.trim(),
              expiryDate,
              lastUpdatedAt: now,
              updatedById: userId,
            },
            update: {
              currentStock: { increment: row.quantity },
              unit: row.unit?.trim() || medicine.unit,
              batchNumber: row.batchNumber?.trim() || undefined,
              expiryDate: expiryDate || undefined,
              lastUpdatedAt: now,
              updatedById: userId,
            },
          });

          await tx.stockTransaction.create({
            data: {
              facilityId: dto.facilityId,
              stockId: stock.id,
              medicineId: medicine.id,
              type: StockTransactionType.RECEIPT,
              quantity: row.quantity,
              balanceAfter: stock.currentStock,
              batchNumber: row.batchNumber?.trim(),
              expiryDate,
              supplier: row.supplier?.trim(),
              referenceNumber: row.referenceNumber?.trim(),
              notes: `Imported via batch import row #${row.rowNumber}`,
              createdById: userId,
              createdAt: now,
            },
          });
        });

        successfulRows++;
      } catch (err: any) {
        rowErrors.push({
          row: row.rowNumber,
          reason: err.message || 'Error processing row',
        });
        failedRows++;
      }
    }

    // Persist batch record if idempotency key provided
    if (dto.idempotencyKey) {
      await this.prisma.inventoryImportBatch.create({
        data: {
          facilityId: dto.facilityId,
          idempotencyKey: dto.idempotencyKey,
          totalRows: dto.rows.length,
          successfulRows,
          failedRows,
          errors: rowErrors.length > 0 ? (rowErrors as any) : undefined,
          createdById: userId,
          createdAt: now,
        },
      });
    }

    return {
      facilityId: dto.facilityId,
      idempotencyKey: dto.idempotencyKey,
      idempotentReplay: false,
      totalRows: dto.rows.length,
      successfulRows,
      failedRows,
      errors: rowErrors,
      message: `Import completed: ${successfulRows} successful, ${failedRows} failed`,
    };
  }
}
