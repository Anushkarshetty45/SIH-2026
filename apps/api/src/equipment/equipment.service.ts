import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { CreateEquipmentDto, UpdateEquipmentDto, EquipmentQueryDto } from './dto/equipment.dto';
import { EquipmentStatus } from '@prisma/client';
import {
  isLifeCriticalEquipment,
  STALE_LIFE_CRITICAL_WARNING,
} from '../common/constants/freshness.constants';

export interface EquipmentItemWithFreshness {
  id: string;
  facilityId: string;
  name: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  status: EquipmentStatus;
  lastUpdatedAt: Date;
  updatedById?: string | null;
  isLifeCritical: boolean;
  isStale: boolean;
  unreliableForEmergency: boolean;
  criticalWarning: string | null;
}

export interface FacilityEquipmentResponse {
  facilityId: string;
  facilityName: string;
  equipment: EquipmentItemWithFreshness[];
  totalEquipmentCount: number;
  operationalCount: number;
  criticalOperationalCount: number;
  hasStaleLifeCriticalEquipment: boolean;
  lastUpdatedAt: Date;
  isStale: boolean;
  ageMinutes: number;
}

@Injectable()
export class EquipmentService {
  private readonly defaultStaleMinutes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
  ) {
    this.defaultStaleMinutes =
      this.config.get<number>('app.staleThresholds.equipmentMinutes') ?? 120;
  }

  async create(dto: CreateEquipmentDto, updatedById?: string) {
    const facility = await this.prisma.facility.findUnique({
      where: { id: dto.facilityId },
    });
    if (!facility) {
      throw new NotFoundException(`Facility ${dto.facilityId} not found`);
    }

    if (dto.availableQuantity > dto.totalQuantity) {
      throw new BadRequestException('availableQuantity cannot exceed totalQuantity');
    }

    const existing = await this.prisma.equipment.findUnique({
      where: {
        facilityId_name: {
          facilityId: dto.facilityId,
          name: dto.name,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Equipment with name '${dto.name}' already registered in facility ${dto.facilityId}`,
      );
    }

    const serverNow = new Date();
    const equipment = await this.prisma.equipment.create({
      data: {
        facilityId: dto.facilityId,
        name: dto.name,
        category: dto.category,
        totalQuantity: dto.totalQuantity,
        availableQuantity: dto.availableQuantity,
        status: dto.status ?? EquipmentStatus.OPERATIONAL,
        lastUpdatedAt: serverNow,
        updatedById: updatedById ?? null,
      },
      include: {
        facility: { select: { id: true, name: true, district: true } },
      },
    });

    await this.prisma.facility.update({
      where: { id: dto.facilityId },
      data: { lastUpdatedAt: serverNow },
    });

    await this.auditService.log(
      'EQUIPMENT_CREATED',
      updatedById ?? null,
      'Equipment',
      equipment.id,
      { name: dto.name, category: dto.category, total: dto.totalQuantity },
    );

    return equipment;
  }

  async update(id: string, dto: UpdateEquipmentDto, updatedById?: string) {
    const equipment = await this.prisma.equipment.findUnique({ where: { id } });
    if (!equipment) {
      throw new NotFoundException(`Equipment ${id} not found`);
    }

    const newTotal = dto.totalQuantity ?? equipment.totalQuantity;
    const newAvailable = dto.availableQuantity ?? equipment.availableQuantity;

    if (newAvailable > newTotal) {
      throw new BadRequestException(
        `availableQuantity (${newAvailable}) cannot exceed totalQuantity (${newTotal})`,
      );
    }

    const serverNow = new Date();
    const updated = await this.prisma.equipment.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.category && { category: dto.category }),
        ...(dto.totalQuantity !== undefined && { totalQuantity: dto.totalQuantity }),
        ...(dto.availableQuantity !== undefined && { availableQuantity: dto.availableQuantity }),
        ...(dto.status && { status: dto.status }),
        lastUpdatedAt: serverNow,
        updatedById: updatedById ?? null,
      },
      include: {
        facility: { select: { id: true, name: true, district: true } },
      },
    });

    await this.prisma.facility.update({
      where: { id: equipment.facilityId },
      data: { lastUpdatedAt: serverNow },
    });

    await this.auditService.log('EQUIPMENT_UPDATED', updatedById ?? null, 'Equipment', id, dto);

    return updated;
  }

  async findById(id: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      include: {
        facility: { select: { id: true, name: true, district: true } },
      },
    });
    if (!equipment) throw new NotFoundException(`Equipment ${id} not found`);
    return equipment;
  }

  async list(query: EquipmentQueryDto) {
    const page = Number(query.page ?? 1);
    const limit = Math.min(Number(query.limit ?? 50), 100);
    const skip = (page - 1) * limit;

    const where = {
      ...(query.facilityId && { facilityId: query.facilityId }),
      ...(query.category && { category: query.category }),
      ...(query.status && { status: query.status }),
    };

    const [equipment, total] = await Promise.all([
      this.prisma.equipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.equipment.count({ where }),
    ]);

    return { equipment, total, page, limit };
  }

  async getFacilityEquipment(facilityId: string): Promise<FacilityEquipmentResponse> {
    const facility = await this.prisma.facility.findUnique({
      where: { id: facilityId },
      select: { id: true, name: true, lastUpdatedAt: true },
    });
    if (!facility) {
      throw new NotFoundException(`Facility ${facilityId} not found`);
    }

    const items = await this.prisma.equipment.findMany({
      where: { facilityId },
      orderBy: { category: 'asc' },
    });

    let totalEquipmentCount = 0;
    let operationalCount = 0;
    let criticalOperationalCount = 0;
    let latestUpdate = facility.lastUpdatedAt;

    for (const item of items) {
      totalEquipmentCount += item.totalQuantity;
      if (item.status === EquipmentStatus.OPERATIONAL) {
        operationalCount += item.availableQuantity;
        if (isLifeCriticalEquipment(item.name, item.category)) {
          criticalOperationalCount += item.availableQuantity;
        }
      }
      if (item.lastUpdatedAt > latestUpdate) {
        latestUpdate = item.lastUpdatedAt;
      }
    }

    const ageMs = Date.now() - latestUpdate.getTime();
    const ageMinutes = Math.max(0, Math.floor(ageMs / (60 * 1000)));
    const isStale = ageMinutes > this.defaultStaleMinutes;

    let hasStaleLifeCriticalEquipment = false;

    const enrichedEquipment: EquipmentItemWithFreshness[] = items.map((item) => {
      const isCritical = isLifeCriticalEquipment(item.name, item.category);
      const unreliable = isCritical && isStale;
      if (unreliable && item.availableQuantity > 0) {
        hasStaleLifeCriticalEquipment = true;
      }

      return {
        ...item,
        isLifeCritical: isCritical,
        isStale,
        unreliableForEmergency: unreliable,
        criticalWarning: unreliable ? STALE_LIFE_CRITICAL_WARNING : null,
      };
    });

    return {
      facilityId: facility.id,
      facilityName: facility.name,
      equipment: enrichedEquipment,
      totalEquipmentCount,
      operationalCount,
      criticalOperationalCount,
      hasStaleLifeCriticalEquipment,
      lastUpdatedAt: latestUpdate,
      isStale,
      ageMinutes,
    };
  }

  async getStaleEquipment(thresholdMinutes?: number) {
    const minutes = thresholdMinutes ?? this.defaultStaleMinutes;
    const thresholdDate = new Date(Date.now() - minutes * 60 * 1000);

    const staleFacilities = await this.prisma.facility.findMany({
      where: {
        lastUpdatedAt: { lt: thresholdDate },
        Equipment: { some: {} },
      },
      select: {
        id: true,
        name: true,
        district: true,
        lastUpdatedAt: true,
        admin: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
      orderBy: { lastUpdatedAt: 'asc' },
    });

    return staleFacilities.map((f) => ({
      facilityId: f.id,
      facilityName: f.name,
      district: f.district,
      lastUpdatedAt: f.lastUpdatedAt,
      staleForMinutes: Math.floor((Date.now() - f.lastUpdatedAt.getTime()) / (60 * 1000)),
      adminContact: f.admin,
    }));
  }
}
