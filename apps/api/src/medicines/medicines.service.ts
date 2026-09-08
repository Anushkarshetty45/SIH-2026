import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateMedicineDto,
  UpdateMedicineDto,
  MedicineQueryDto,
  CreateAlternativeDto,
} from './dto/medicine.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class MedicinesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMedicineDto) {
    try {
      return await this.prisma.medicine.create({
        data: {
          name: dto.name.trim(),
          genericName: dto.genericName.trim(),
          dosageForm: dto.dosageForm.toUpperCase().trim(),
          strength: dto.strength.trim(),
          category: dto.category?.trim(),
          manufacturer: dto.manufacturer?.trim(),
          unit: dto.unit?.trim() || 'tablets',
          description: dto.description?.trim(),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(
          `Medicine with name '${dto.name}', strength '${dto.strength}', and dosage form '${dto.dosageForm}' already exists`,
        );
      }
      throw error;
    }
  }

  async findAll(query: MedicineQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.MedicineWhereInput = {
      isActive: true,
    };

    if (query.genericName) {
      where.genericName = {
        contains: query.genericName,
        mode: 'insensitive',
      };
    }

    if (query.category) {
      where.category = {
        contains: query.category,
        mode: 'insensitive',
      };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { genericName: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.medicine.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ genericName: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.medicine.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const medicine = await this.prisma.medicine.findUnique({
      where: { id },
      include: {
        PrimaryForAlternatives: {
          include: {
            alternativeMedicine: true,
          },
        },
      },
    });

    if (!medicine) {
      throw new NotFoundException(`Medicine with ID ${id} not found`);
    }

    return medicine;
  }

  async update(id: string, dto: UpdateMedicineDto) {
    await this.findOne(id);

    try {
      return await this.prisma.medicine.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name.trim() }),
          ...(dto.genericName && { genericName: dto.genericName.trim() }),
          ...(dto.dosageForm && { dosageForm: dto.dosageForm.toUpperCase().trim() }),
          ...(dto.strength && { strength: dto.strength.trim() }),
          ...(dto.category !== undefined && { category: dto.category?.trim() }),
          ...(dto.manufacturer !== undefined && { manufacturer: dto.manufacturer?.trim() }),
          ...(dto.unit !== undefined && { unit: dto.unit?.trim() }),
          ...(dto.description !== undefined && { description: dto.description?.trim() }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(
          'A medicine with the same name, strength, and dosage form already exists',
        );
      }
      throw error;
    }
  }

  async addAlternative(medicineId: string, dto: CreateAlternativeDto) {
    if (medicineId === dto.alternativeMedicineId) {
      throw new BadRequestException('A medicine cannot be marked as an alternative to itself');
    }

    // Verify both medicines exist
    const [primary, alternative] = await Promise.all([
      this.prisma.medicine.findUnique({ where: { id: medicineId } }),
      this.prisma.medicine.findUnique({ where: { id: dto.alternativeMedicineId } }),
    ]);

    if (!primary) {
      throw new NotFoundException(`Primary medicine ${medicineId} not found`);
    }
    if (!alternative) {
      throw new NotFoundException(`Alternative medicine ${dto.alternativeMedicineId} not found`);
    }

    try {
      return await this.prisma.medicineAlternative.create({
        data: {
          medicineId,
          alternativeMedicineId: dto.alternativeMedicineId,
          notes: dto.notes,
        },
        include: {
          alternativeMedicine: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('This alternative relationship has already been registered');
      }
      throw error;
    }
  }

  async getAlternatives(medicineId: string, facilityId?: string) {
    const primary = await this.prisma.medicine.findUnique({
      where: { id: medicineId },
      include: facilityId
        ? {
            Stocks: {
              where: { facilityId },
            },
          }
        : undefined,
    });

    if (!primary) {
      throw new NotFoundException(`Medicine ${medicineId} not found`);
    }

    // 1. Explicit controlled alternatives
    const explicitAlternatives = await this.prisma.medicineAlternative.findMany({
      where: { medicineId },
      include: {
        alternativeMedicine: {
          include: facilityId
            ? {
                Stocks: {
                  where: { facilityId },
                },
              }
            : undefined,
        },
      },
    });

    const explicitIds = new Set(explicitAlternatives.map((a) => a.alternativeMedicineId));

    // 2. Deterministic generic equivalents (same genericName, strength, dosageForm, not itself)
    const genericEquivalents = await this.prisma.medicine.findMany({
      where: {
        id: { not: medicineId, notIn: Array.from(explicitIds) },
        genericName: { equals: primary.genericName, mode: 'insensitive' },
        strength: { equals: primary.strength, mode: 'insensitive' },
        dosageForm: { equals: primary.dosageForm, mode: 'insensitive' },
        isActive: true,
      },
      include: facilityId
        ? {
            Stocks: {
              where: { facilityId },
            },
          }
        : undefined,
    });

    const formatItem = (m: any, type: string, notes?: string | null) => {
      const stock = m.Stocks?.[0];
      const currentStock = stock ? stock.currentStock : 0;
      const reorderLevel = stock ? stock.reorderLevel : 10;
      let status = 'OUT_OF_STOCK';
      if (currentStock > reorderLevel) status = 'AVAILABLE';
      else if (currentStock > 0) status = 'LOW_STOCK';

      const ageMinutes = stock
        ? Math.floor((Date.now() - stock.lastUpdatedAt.getTime()) / (1000 * 60))
        : null;

      return {
        id: m.id,
        name: m.name,
        genericName: m.genericName,
        strength: m.strength,
        dosageForm: m.dosageForm,
        category: m.category,
        manufacturer: m.manufacturer,
        type,
        notes:
          notes ||
          (type === 'GENERIC_EQUIVALENT'
            ? 'Identical generic molecule, strength, and dosage form'
            : undefined),
        ...(facilityId && {
          availability: {
            facilityId,
            currentStock,
            unit: stock?.unit || m.unit,
            status,
            isStale: ageMinutes !== null ? ageMinutes > 120 : true,
            ageMinutes,
            lastUpdatedAt: stock?.lastUpdatedAt || null,
          },
        }),
      };
    };

    return {
      medicine: {
        id: primary.id,
        name: primary.name,
        genericName: primary.genericName,
        strength: primary.strength,
        dosageForm: primary.dosageForm,
        ...(facilityId && {
          currentStock: (primary as any).Stocks?.[0]?.currentStock ?? 0,
        }),
      },
      clinicalNote:
        'Alternative medicines are deterministic reference suggestions. The prescribing clinician must evaluate clinical appropriateness. Alternative available does NOT mean automatic substitution.',
      substitutionRule: 'DETERMINISTIC_CONTROLLED_ONLY',
      controlledAlternatives: explicitAlternatives.map((a) =>
        formatItem(a.alternativeMedicine, 'CONTROLLED_MAPPING', a.notes),
      ),
      genericEquivalents: genericEquivalents.map((m) => formatItem(m, 'GENERIC_EQUIVALENT')),
    };
  }

  async removeAlternative(medicineId: string, alternativeMedicineId: string) {
    const record = await this.prisma.medicineAlternative.findUnique({
      where: {
        medicineId_alternativeMedicineId: {
          medicineId,
          alternativeMedicineId,
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Alternative link not found');
    }

    await this.prisma.medicineAlternative.delete({
      where: { id: record.id },
    });

    return { message: 'Alternative link successfully removed' };
  }
}
