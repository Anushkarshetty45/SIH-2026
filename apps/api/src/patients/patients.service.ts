import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreatePatientDto, UpdatePatientDto, UpdateConsentDto } from './dto/patient.dto';

const PATIENT_SELECT = {
  id: true,
  name: true,
  dateOfBirth: true,
  gender: true,
  phone: true,
  address: true,
  district: true,
  state: true,
  abhaId: true,
  preferredLanguage: true,
  consentStatus: true,
  registeredById: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePatientDto, registeredById: string) {
    // If abhaId provided, check uniqueness
    if (dto.abhaId) {
      const existing = await this.prisma.patient.findUnique({ where: { abhaId: dto.abhaId } });
      if (existing)
        throw new ConflictException(`Patient with ABHA ID ${dto.abhaId} already registered`);
    }

    return this.prisma.patient.create({
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        registeredById,
      },
      select: PATIENT_SELECT,
    });
  }

  async findById(id: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id }, select: PATIENT_SELECT });
    if (!patient) throw new NotFoundException(`Patient ${id} not found`);
    return patient;
  }

  async findByAbha(abhaId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { abhaId },
      select: PATIENT_SELECT,
    });
    if (!patient) throw new NotFoundException('Patient not found for ABHA ID');
    return patient;
  }

  async update(id: string, dto: UpdatePatientDto) {
    await this.findById(id);
    return this.prisma.patient.update({ where: { id }, data: dto, select: PATIENT_SELECT });
  }

  async updateConsent(id: string, dto: UpdateConsentDto) {
    await this.findById(id);
    const patient = await this.prisma.patient.update({
      where: { id },
      data: { consentStatus: dto.consentStatus },
      select: PATIENT_SELECT,
    });

    // Also create a consent record for audit trail
    await this.prisma.consent.create({
      data: {
        patientId: id,
        purpose: dto.purpose ?? 'GENERAL',
        status: dto.consentStatus,
        grantedAt: dto.consentStatus === 'GRANTED' ? new Date() : undefined,
        revokedAt: dto.consentStatus === 'REVOKED' ? new Date() : undefined,
      },
    });

    return patient;
  }

  async list(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        skip,
        take: limit,
        select: PATIENT_SELECT,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.patient.count(),
    ]);
    return { patients, total, page, limit };
  }
}
