import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateFacilityDto, UpdateFacilityDto, FacilityQueryDto } from './dto/facility.dto';
import { ConfigService } from '@nestjs/config';

/** Availability data older than this (ms) is considered stale */
const DEFAULT_STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

const FACILITY_SELECT = {
  id: true,
  name: true,
  type: true,
  status: true,
  address: true,
  district: true,
  state: true,
  pincode: true,
  latitude: true,
  longitude: true,
  contactPhone: true,
  adminId: true,
  lastUpdatedAt: true,
  createdAt: true,
};

@Injectable()
export class FacilitiesService {
  private readonly staleThresholdMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.staleThresholdMs =
      this.config.get<number>('app.facilityStaleThresholdMs') ?? DEFAULT_STALE_THRESHOLD_MS;
  }

  async create(dto: CreateFacilityDto) {
    return this.prisma.facility.create({
      data: dto,
      select: FACILITY_SELECT,
    });
  }

  async findById(id: string) {
    const facility = await this.prisma.facility.findUnique({
      where: { id },
      select: FACILITY_SELECT,
    });
    if (!facility) throw new NotFoundException(`Facility ${id} not found`);
    return facility;
  }

  async list(query: FacilityQueryDto) {
    const page = Number(query.page ?? 1);
    const limit = Math.min(Number(query.limit ?? 20), 100);
    const skip = (page - 1) * limit;

    const where = {
      ...(query.district && { district: query.district }),
      ...(query.type && { type: query.type }),
      ...(query.status && { status: query.status }),
    };

    const [facilities, total] = await Promise.all([
      this.prisma.facility.findMany({
        where,
        skip,
        take: limit,
        select: FACILITY_SELECT,
        orderBy: { name: 'asc' },
      }),
      this.prisma.facility.count({ where }),
    ]);

    return { facilities, total, page, limit };
  }

  async update(id: string, dto: UpdateFacilityDto) {
    await this.findById(id);
    return this.prisma.facility.update({
      where: { id },
      data: dto,
      select: FACILITY_SELECT,
    });
  }

  /**
   * Returns facility with an explicit `isStale` flag on availability data.
   * Clients MUST NOT show stale availability as current.
   */
  async getAvailability(id: string) {
    const facility = await this.findById(id);
    const ageMs = Date.now() - facility.lastUpdatedAt.getTime();
    const isStale = ageMs > this.staleThresholdMs;
    return {
      ...facility,
      isStale,
      dataAgeSeconds: Math.round(ageMs / 1000),
    };
  }
}
