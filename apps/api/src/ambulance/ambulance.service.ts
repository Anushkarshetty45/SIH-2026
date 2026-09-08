import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { TransportStatus } from '@prisma/client';
import {
  CreateAmbulanceDto,
  UpdateAmbulanceDto,
  DispatchAmbulanceDto,
  UpdateTransportStatusDto,
} from './dto/ambulance.dto';
import { AuditService } from '../audit/audit.service';

const AMBULANCE_SELECT = {
  id: true,
  vehicleNumber: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  operator: {
    select: { id: true, name: true, phone: true, email: true },
  },
  currentFacility: {
    select: { id: true, name: true, district: true, type: true },
  },
};

const TRANSPORT_SELECT = {
  id: true,
  emergencyDetails: true,
  status: true,
  dispatchedAt: true,
  arrivedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  ambulance: {
    select: {
      id: true,
      vehicleNumber: true,
      operator: { select: { id: true, name: true, phone: true } },
    },
  },
  patient: {
    select: { id: true, name: true, phone: true },
  },
  receivingFacility: {
    select: { id: true, name: true, district: true, type: true },
  },
};

@Injectable()
export class AmbulanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createAmbulance(dto: CreateAmbulanceDto, actorId: string) {
    const existing = await this.prisma.ambulance.findUnique({
      where: { vehicleNumber: dto.vehicleNumber },
    });
    if (existing) {
      throw new ConflictException(
        `Ambulance with vehicle number ${dto.vehicleNumber} already exists`,
      );
    }

    const ambulance = await this.prisma.ambulance.create({
      data: {
        vehicleNumber: dto.vehicleNumber,
        operatorId: dto.operatorId,
        currentFacilityId: dto.currentFacilityId || null,
      },
      select: AMBULANCE_SELECT,
    });

    await this.auditService.log('AMBULANCE_CREATED', actorId, 'Ambulance', ambulance.id, {
      vehicleNumber: dto.vehicleNumber,
    });

    return ambulance;
  }

  async listAmbulances(facilityId?: string, isActive?: boolean) {
    const where = {
      ...(facilityId && { currentFacilityId: facilityId }),
      ...(isActive !== undefined && { isActive }),
    };

    return this.prisma.ambulance.findMany({
      where,
      select: AMBULANCE_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAmbulanceById(id: string) {
    const ambulance = await this.prisma.ambulance.findUnique({
      where: { id },
      select: AMBULANCE_SELECT,
    });
    if (!ambulance) throw new NotFoundException(`Ambulance ${id} not found`);
    return ambulance;
  }

  async updateAmbulance(id: string, dto: UpdateAmbulanceDto, actorId: string) {
    await this.findAmbulanceById(id);

    const updated = await this.prisma.ambulance.update({
      where: { id },
      data: dto,
      select: AMBULANCE_SELECT,
    });

    await this.auditService.log('AMBULANCE_UPDATED', actorId, 'Ambulance', id, dto);
    return updated;
  }

  async dispatch(dto: DispatchAmbulanceDto, actorId: string) {
    const ambulance = await this.findAmbulanceById(dto.ambulanceId);
    if (!ambulance.isActive) {
      throw new BadRequestException(`Ambulance ${dto.ambulanceId} is currently inactive`);
    }

    const transport = await this.prisma.emergencyTransport.create({
      data: {
        ambulanceId: dto.ambulanceId,
        patientId: dto.patientId || null,
        receivingFacilityId: dto.receivingFacilityId,
        emergencyDetails: dto.emergencyDetails,
        status: TransportStatus.DISPATCHED,
      },
      select: TRANSPORT_SELECT,
    });

    await this.auditService.log(
      'AMBULANCE_DISPATCHED',
      actorId,
      'EmergencyTransport',
      transport.id,
      {
        ambulanceId: dto.ambulanceId,
        receivingFacilityId: dto.receivingFacilityId,
      },
    );

    return transport;
  }

  async updateTransportStatus(id: string, dto: UpdateTransportStatusDto, actorId: string) {
    const transport = await this.prisma.emergencyTransport.findUnique({
      where: { id },
    });
    if (!transport) throw new NotFoundException(`EmergencyTransport ${id} not found`);

    const data: any = { status: dto.status };
    if (dto.status === TransportStatus.ARRIVED && !transport.arrivedAt) {
      data.arrivedAt = new Date();
    } else if (dto.status === TransportStatus.COMPLETED && !transport.completedAt) {
      data.completedAt = new Date();
    }

    const updated = await this.prisma.emergencyTransport.update({
      where: { id },
      data,
      select: TRANSPORT_SELECT,
    });

    await this.auditService.log(
      `TRANSPORT_STATUS_${dto.status}`,
      actorId,
      'EmergencyTransport',
      id,
      {
        status: dto.status,
      },
    );

    return updated;
  }

  async listTransports(status?: TransportStatus, ambulanceId?: string) {
    const where = {
      ...(status && { status }),
      ...(ambulanceId && { ambulanceId }),
    };

    return this.prisma.emergencyTransport.findMany({
      where,
      select: TRANSPORT_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findTransportById(id: string) {
    const transport = await this.prisma.emergencyTransport.findUnique({
      where: { id },
      select: TRANSPORT_SELECT,
    });
    if (!transport) throw new NotFoundException(`EmergencyTransport ${id} not found`);
    return transport;
  }
}
