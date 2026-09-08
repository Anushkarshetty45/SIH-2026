import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppointmentStatus, SlotStatus } from '@prisma/client';
import {
  BookAppointmentDto,
  UpdateAppointmentStatusDto,
  AppointmentQueryDto,
} from './dto/appointment.dto';
import { AuditService } from '../audit/audit.service';

const APPOINTMENT_SELECT = {
  id: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  patient: {
    select: { id: true, name: true, phone: true, abhaId: true },
  },
  doctor: {
    select: {
      id: true,
      specialization: true,
      user: { select: { id: true, name: true, email: true } },
    },
  },
  facility: {
    select: { id: true, name: true, type: true, district: true },
  },
  slot: {
    select: { id: true, date: true, startTime: true, endTime: true, status: true },
  },
  referral: {
    select: { id: true, status: true, urgency: true },
  },
};

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Concurrency-safe appointment booking.
   * Uses interactive transaction with pessimistic lock (SELECT FOR UPDATE)
   * on the AppointmentSlot row to ensure no two requests can double-book.
   */
  async book(dto: BookAppointmentDto, actorId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Pessimistic lock on the slot row
      const lockedSlots = await tx.$queryRaw<Array<{ id: string; status: string }>>`
        SELECT id, status FROM appointment_slots 
        WHERE id = ${dto.slotId}
        FOR UPDATE
      `;

      if (!lockedSlots || lockedSlots.length === 0) {
        throw new NotFoundException(`Slot ${dto.slotId} not found`);
      }

      const slotState = lockedSlots[0];
      if (slotState.status !== SlotStatus.AVAILABLE) {
        throw new ConflictException(
          `Slot ${dto.slotId} is already booked or blocked (current status: ${slotState.status})`,
        );
      }

      // Fetch slot metadata (doctorId, facilityId)
      const slot = await tx.appointmentSlot.findUnique({
        where: { id: dto.slotId },
      });

      if (!slot) {
        throw new NotFoundException(`Slot ${dto.slotId} not found`);
      }

      // 2. Validate patient exists
      const patient = await tx.patient.findUnique({
        where: { id: dto.patientId },
      });
      if (!patient) {
        throw new NotFoundException(`Patient ${dto.patientId} not found`);
      }

      // 3. Mark slot as BOOKED
      await tx.appointmentSlot.update({
        where: { id: dto.slotId },
        data: { status: SlotStatus.BOOKED },
      });

      // 4. Create appointment
      const appointment = await tx.appointment.create({
        data: {
          patientId: dto.patientId,
          doctorId: slot.doctorId,
          facilityId: slot.facilityId,
          slotId: slot.id,
          referralId: dto.referralId || null,
          notes: dto.notes,
          status: AppointmentStatus.SCHEDULED,
        },
        select: APPOINTMENT_SELECT,
      });

      return appointment;
    });

    // 5. Audit log outside transaction
    await this.auditService.log('APPOINTMENT_BOOKED', actorId, 'Appointment', result.id, {
      patientId: dto.patientId,
      slotId: dto.slotId,
      referralId: dto.referralId,
    });

    return result;
  }

  async findById(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      select: APPOINTMENT_SELECT,
    });
    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }
    return appointment;
  }

  async list(query: AppointmentQueryDto) {
    const page = Number(query.page ?? 1);
    const limit = Math.min(Number(query.limit ?? 20), 100);
    const skip = (page - 1) * limit;

    const where = {
      ...(query.patientId && { patientId: query.patientId }),
      ...(query.doctorId && { doctorId: query.doctorId }),
      ...(query.facilityId && { facilityId: query.facilityId }),
      ...(query.status && { status: query.status }),
    };

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        select: APPOINTMENT_SELECT,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { appointments, total, page, limit };
  }

  async updateStatus(id: string, dto: UpdateAppointmentStatusDto, actorId: string) {
    const existing = await this.findById(id);

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id },
        data: {
          status: dto.status,
          notes: dto.notes ? `${existing.notes ?? ''}\n${dto.notes}`.trim() : existing.notes,
        },
        select: APPOINTMENT_SELECT,
      });

      // If appointment was cancelled, free up the slot
      if (dto.status === AppointmentStatus.CANCELLED) {
        await tx.appointmentSlot.update({
          where: { id: existing.slot.id },
          data: { status: SlotStatus.AVAILABLE },
        });
      }

      await this.auditService.log(`APPOINTMENT_STATUS_${dto.status}`, actorId, 'Appointment', id, {
        previousStatus: existing.status,
        newStatus: dto.status,
        notes: dto.notes,
      });

      return updated;
    });
  }

  async cancel(id: string, reason: string | undefined, actorId: string) {
    return this.updateStatus(id, { status: AppointmentStatus.CANCELLED, notes: reason }, actorId);
  }
}
