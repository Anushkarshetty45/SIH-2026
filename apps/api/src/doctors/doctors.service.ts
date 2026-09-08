import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';

const DOCTOR_SELECT = {
  id: true,
  userId: true,
  facilityId: true,
  specialization: true,
  registrationNo: true,
  isAvailable: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true, email: true, phone: true } },
  facility: { select: { id: true, name: true, type: true, district: true } },
};

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDoctorDto) {
    // Check no duplicate registrationNo
    const existing = await this.prisma.doctor.findUnique({
      where: { registrationNo: dto.registrationNo },
    });
    if (existing) {
      throw new ConflictException(`Doctor with registration ${dto.registrationNo} already exists`);
    }

    return this.prisma.doctor.create({
      data: dto,
      select: DOCTOR_SELECT,
    });
  }

  async findById(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      select: DOCTOR_SELECT,
    });
    if (!doctor) throw new NotFoundException(`Doctor ${id} not found`);
    return doctor;
  }

  async findByUserId(userId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId },
      select: DOCTOR_SELECT,
    });
    if (!doctor) throw new NotFoundException('Doctor profile not found for user');
    return doctor;
  }

  async listByFacility(facilityId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [doctors, total] = await Promise.all([
      this.prisma.doctor.findMany({
        where: { facilityId },
        skip,
        take: limit,
        select: DOCTOR_SELECT,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.doctor.count({ where: { facilityId } }),
    ]);
    return { doctors, total, page, limit };
  }

  async listAll(page = 1, limit = 20, specialization?: string) {
    const skip = (page - 1) * limit;
    const where = specialization
      ? { specialization: { contains: specialization, mode: 'insensitive' as const } }
      : {};
    const [doctors, total] = await Promise.all([
      this.prisma.doctor.findMany({ where, skip, take: limit, select: DOCTOR_SELECT }),
      this.prisma.doctor.count({ where }),
    ]);
    return { doctors, total, page, limit };
  }

  async update(id: string, dto: UpdateDoctorDto) {
    await this.findById(id);
    return this.prisma.doctor.update({
      where: { id },
      data: dto,
      select: DOCTOR_SELECT,
    });
  }
}
