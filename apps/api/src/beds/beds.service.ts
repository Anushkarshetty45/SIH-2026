import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { CreateBedDto, BatchCreateBedsDto, UpdateBedStatusDto, BedQueryDto } from './dto/bed.dto';
import { BedCategory, BedStatus } from '@prisma/client';
import {
  STALE_LIFE_CRITICAL_WARNING,
  isLifeCriticalBedCategory,
} from '../common/constants/freshness.constants';

export interface BedCategorySummary {
  category: BedCategory;
  total: number;
  available: number;
  occupied: number;
  isLifeCritical: boolean;
  isStale: boolean;
  unreliableForEmergency: boolean;
  criticalWarning: string | null;
}

export interface LifeCriticalBedsSummary {
  icuAvailable: number;
  oxygenAvailable: number;
  ventilatorAvailable: number;
  isStale: boolean;
  unreliableForEmergency: boolean;
  criticalWarning: string | null;
}

export interface FacilityBedSummary {
  facilityId: string;
  facilityName: string;
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  breakdown: Record<BedCategory, BedCategorySummary>;
  lifeCriticalSummary: LifeCriticalBedsSummary;
  hasStaleLifeCriticalBeds: boolean;
  emergencyDispatchSafe: boolean;
  lastUpdatedAt: Date;
  isStale: boolean;
  ageMinutes: number;
}

@Injectable()
export class BedsService {
  private readonly defaultStaleMinutes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
  ) {
    this.defaultStaleMinutes = this.config.get<number>('app.staleThresholds.bedsMinutes') ?? 120;
  }

  async create(dto: CreateBedDto, updatedById?: string) {
    const facility = await this.prisma.facility.findUnique({
      where: { id: dto.facilityId },
    });
    if (!facility) {
      throw new NotFoundException(`Facility ${dto.facilityId} not found`);
    }

    const existing = await this.prisma.bed.findUnique({
      where: {
        facilityId_bedNumber: {
          facilityId: dto.facilityId,
          bedNumber: dto.bedNumber,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Bed with number ${dto.bedNumber} already exists in facility ${dto.facilityId}`,
      );
    }

    const serverNow = new Date();
    const bed = await this.prisma.bed.create({
      data: {
        facilityId: dto.facilityId,
        bedNumber: dto.bedNumber,
        ward: dto.ward,
        category: dto.category ?? BedCategory.GENERAL,
        status: dto.status ?? BedStatus.AVAILABLE,
        lastUpdatedAt: serverNow,
        updatedById: updatedById ?? null,
      },
      include: {
        facility: { select: { id: true, name: true, district: true } },
      },
    });

    // Touch facility's lastUpdatedAt
    await this.prisma.facility.update({
      where: { id: dto.facilityId },
      data: { lastUpdatedAt: serverNow },
    });

    await this.auditService.log('BED_CREATED', updatedById ?? null, 'Bed', bed.id, {
      bedNumber: dto.bedNumber,
      ward: dto.ward,
      category: bed.category,
    });

    return bed;
  }

  async batchCreate(dto: BatchCreateBedsDto, updatedById?: string) {
    const facility = await this.prisma.facility.findUnique({
      where: { id: dto.facilityId },
    });
    if (!facility) {
      throw new NotFoundException(`Facility ${dto.facilityId} not found`);
    }

    const serverNow = new Date();
    const records = [];
    for (let i = 1; i <= dto.count; i++) {
      const padded = String(i).padStart(2, '0');
      records.push({
        facilityId: dto.facilityId,
        bedNumber: `${dto.prefix}${padded}`,
        ward: dto.ward,
        category: dto.category,
        status: BedStatus.AVAILABLE,
        lastUpdatedAt: serverNow,
        updatedById: updatedById ?? null,
      });
    }

    await this.prisma.bed.createMany({
      data: records,
      skipDuplicates: true,
    });

    await this.prisma.facility.update({
      where: { id: dto.facilityId },
      data: { lastUpdatedAt: serverNow },
    });

    await this.auditService.log(
      'BEDS_BATCH_CREATED',
      updatedById ?? null,
      'Facility',
      dto.facilityId,
      { count: dto.count, category: dto.category, ward: dto.ward },
    );

    return this.getFacilityBedSummary(dto.facilityId);
  }

  async updateStatus(id: string, dto: UpdateBedStatusDto, updatedById?: string) {
    const bed = await this.prisma.bed.findUnique({ where: { id } });
    if (!bed) {
      throw new NotFoundException(`Bed ${id} not found`);
    }

    const serverNow = new Date();
    const updated = await this.prisma.bed.update({
      where: { id },
      data: {
        status: dto.status,
        lastUpdatedAt: serverNow,
        updatedById: updatedById ?? null,
      },
      include: {
        facility: { select: { id: true, name: true, district: true } },
      },
    });

    // Update parent facility's availability timestamp
    await this.prisma.facility.update({
      where: { id: bed.facilityId },
      data: { lastUpdatedAt: serverNow },
    });

    await this.auditService.log('BED_STATUS_UPDATED', updatedById ?? null, 'Bed', id, {
      previousStatus: bed.status,
      newStatus: dto.status,
    });

    return updated;
  }

  async findById(id: string) {
    const bed = await this.prisma.bed.findUnique({
      where: { id },
      include: {
        facility: { select: { id: true, name: true, district: true } },
      },
    });
    if (!bed) throw new NotFoundException(`Bed ${id} not found`);
    return bed;
  }

  async list(query: BedQueryDto) {
    const page = Number(query.page ?? 1);
    const limit = Math.min(Number(query.limit ?? 50), 100);
    const skip = (page - 1) * limit;

    const where = {
      ...(query.facilityId && { facilityId: query.facilityId }),
      ...(query.ward && { ward: query.ward }),
      ...(query.category && { category: query.category }),
      ...(query.status && { status: query.status }),
    };

    const [beds, total] = await Promise.all([
      this.prisma.bed.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ ward: 'asc' }, { bedNumber: 'asc' }],
      }),
      this.prisma.bed.count({ where }),
    ]);

    return { beds, total, page, limit };
  }

  async getFacilityBedSummary(facilityId: string): Promise<FacilityBedSummary> {
    const facility = await this.prisma.facility.findUnique({
      where: { id: facilityId },
      select: { id: true, name: true, lastUpdatedAt: true },
    });
    if (!facility) {
      throw new NotFoundException(`Facility ${facilityId} not found`);
    }

    const beds = await this.prisma.bed.findMany({
      where: { facilityId },
      select: {
        id: true,
        category: true,
        status: true,
        lastUpdatedAt: true,
      },
    });

    let totalBeds = 0;
    let availableBeds = 0;
    let occupiedBeds = 0;
    let latestUpdate = facility.lastUpdatedAt;

    const breakdown: Partial<Record<BedCategory, BedCategorySummary>> = {};
    for (const cat of Object.values(BedCategory)) {
      breakdown[cat] = {
        category: cat,
        total: 0,
        available: 0,
        occupied: 0,
        isLifeCritical: isLifeCriticalBedCategory(cat),
        isStale: false,
        unreliableForEmergency: false,
        criticalWarning: null,
      };
    }

    for (const b of beds) {
      totalBeds++;
      if (b.status === BedStatus.AVAILABLE) availableBeds++;
      if (b.status === BedStatus.OCCUPIED) occupiedBeds++;

      if (b.lastUpdatedAt > latestUpdate) {
        latestUpdate = b.lastUpdatedAt;
      }

      const catSummary = breakdown[b.category];
      if (catSummary) {
        catSummary.total++;
        if (b.status === BedStatus.AVAILABLE) catSummary.available++;
        if (b.status === BedStatus.OCCUPIED) catSummary.occupied++;
      }
    }

    const ageMs = Date.now() - latestUpdate.getTime();
    const ageMinutes = Math.max(0, Math.floor(ageMs / (60 * 1000)));
    const isStale = ageMinutes > this.defaultStaleMinutes;

    // Apply life-critical rules to breakdown
    for (const cat of Object.values(BedCategory)) {
      const isCritical = isLifeCriticalBedCategory(cat);
      const isCatStale = isStale;
      const unreliable = isCritical && isCatStale;

      if (breakdown[cat]) {
        breakdown[cat]!.isLifeCritical = isCritical;
        breakdown[cat]!.isStale = isCatStale;
        breakdown[cat]!.unreliableForEmergency = unreliable;
        breakdown[cat]!.criticalWarning = unreliable ? STALE_LIFE_CRITICAL_WARNING : null;
      }
    }

    const icuAvail = breakdown[BedCategory.ICU]?.available ?? 0;
    const oxygenAvail = breakdown[BedCategory.OXYGEN]?.available ?? 0;
    const ventAvail = breakdown[BedCategory.VENTILATOR]?.available ?? 0;

    const hasStaleLifeCriticalBeds =
      isStale &&
      (icuAvail > 0 ||
        oxygenAvail > 0 ||
        ventAvail > 0 ||
        (breakdown[BedCategory.ICU]?.total ?? 0) > 0);

    const lifeCriticalSummary: LifeCriticalBedsSummary = {
      icuAvailable: icuAvail,
      oxygenAvailable: oxygenAvail,
      ventilatorAvailable: ventAvail,
      isStale,
      unreliableForEmergency: isStale,
      criticalWarning: isStale ? STALE_LIFE_CRITICAL_WARNING : null,
    };

    // Emergency dispatch is only safe if data is fresh and has at least one emergency bed available
    const emergencyDispatchSafe = !isStale && (icuAvail > 0 || oxygenAvail > 0 || ventAvail > 0);

    return {
      facilityId: facility.id,
      facilityName: facility.name,
      totalBeds,
      availableBeds,
      occupiedBeds,
      breakdown: breakdown as Record<BedCategory, BedCategorySummary>,
      lifeCriticalSummary,
      hasStaleLifeCriticalBeds,
      emergencyDispatchSafe,
      lastUpdatedAt: latestUpdate,
      isStale,
      ageMinutes,
    };
  }

  /**
   * Emergency Bed Availability Query
   * Life-critical query used by ambulance EMTs, 108 dispatch, and referral doctors.
   * Stale data is NEVER presented as trusted emergency capacity.
   */
  async getEmergencyBedAvailability(facilityId?: string, district?: string) {
    const facilities = await this.prisma.facility.findMany({
      where: {
        ...(facilityId && { id: facilityId }),
        ...(district && { district: { equals: district, mode: 'insensitive' } }),
        Beds: {
          some: {
            category: { in: [BedCategory.ICU, BedCategory.OXYGEN, BedCategory.VENTILATOR] },
          },
        },
      },
      select: {
        id: true,
        name: true,
        district: true,
        type: true,
        contactPhone: true,
        lastUpdatedAt: true,
        Beds: {
          where: {
            category: { in: [BedCategory.ICU, BedCategory.OXYGEN, BedCategory.VENTILATOR] },
          },
          select: {
            id: true,
            bedNumber: true,
            ward: true,
            category: true,
            status: true,
            lastUpdatedAt: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const results = facilities.map((fac) => {
      let icuAvailable = 0;
      let oxygenAvailable = 0;
      let ventilatorAvailable = 0;
      let latestBedUpdate = fac.lastUpdatedAt;

      for (const b of fac.Beds) {
        if (b.status === BedStatus.AVAILABLE) {
          if (b.category === BedCategory.ICU) icuAvailable++;
          if (b.category === BedCategory.OXYGEN) oxygenAvailable++;
          if (b.category === BedCategory.VENTILATOR) ventilatorAvailable++;
        }
        if (b.lastUpdatedAt > latestBedUpdate) {
          latestBedUpdate = b.lastUpdatedAt;
        }
      }

      const ageMs = Date.now() - latestBedUpdate.getTime();
      const ageMinutes = Math.max(0, Math.floor(ageMs / (60 * 1000)));
      const isStale = ageMinutes > this.defaultStaleMinutes;

      return {
        facilityId: fac.id,
        facilityName: fac.name,
        district: fac.district,
        facilityType: fac.type,
        contactPhone: fac.contactPhone,
        lastUpdatedAt: latestBedUpdate,
        ageMinutes,
        isStale,
        emergencyDispatchSafe:
          !isStale && (icuAvailable > 0 || oxygenAvailable > 0 || ventilatorAvailable > 0),
        unreliableForEmergency: isStale,
        criticalWarning: isStale ? STALE_LIFE_CRITICAL_WARNING : null,
        emergencyBeds: {
          icuAvailable,
          oxygenAvailable,
          ventilatorAvailable,
          totalEmergencyAvailable: icuAvailable + oxygenAvailable + ventilatorAvailable,
        },
      };
    });

    return {
      count: results.length,
      staleThresholdMinutes: this.defaultStaleMinutes,
      facilities: results,
    };
  }

  /**
   * Identifies facilities whose bed availability has exceeded the staleness threshold.
   * D3's BullMQ scheduler calls this for automated SMS/escalation alerts.
   */
  async getStaleFacilities(thresholdMinutes?: number) {
    const minutes = thresholdMinutes ?? this.defaultStaleMinutes;
    const thresholdDate = new Date(Date.now() - minutes * 60 * 1000);

    // Find facilities where lastUpdatedAt is older than threshold
    const staleFacilities = await this.prisma.facility.findMany({
      where: {
        lastUpdatedAt: { lt: thresholdDate },
        Beds: { some: {} }, // Only facilities that actually track beds
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
