import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateScheduleDto, GenerateSlotsDto, UpdateSlotDto } from './dto/availability.dto';
import { DayOfWeek, SlotStatus } from '@prisma/client';

const DAY_MAP: Record<string, DayOfWeek> = {
  Sun: DayOfWeek.SUN,
  Mon: DayOfWeek.MON,
  Tue: DayOfWeek.TUE,
  Wed: DayOfWeek.WED,
  Thu: DayOfWeek.THU,
  Fri: DayOfWeek.FRI,
  Sat: DayOfWeek.SAT,
};

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async createSchedule(doctorId: string, dto: CreateScheduleDto) {
    return this.prisma.doctorSchedule.upsert({
      where: {
        doctorId_facilityId_dayOfWeek: {
          doctorId,
          facilityId: dto.facilityId,
          dayOfWeek: dto.dayOfWeek,
        },
      },
      create: { doctorId, ...dto },
      update: {
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotDurationMinutes: dto.slotDurationMinutes ?? 15,
        isActive: true,
      },
    });
  }

  async getSchedules(doctorId: string) {
    return this.prisma.doctorSchedule.findMany({
      where: { doctorId, isActive: true },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  /**
   * Generates AppointmentSlot records for a given doctor on a specific date
   * based on their DoctorSchedule for that day-of-week.
   * Skips slots that already exist (idempotent).
   */
  async generateSlots(doctorId: string, dto: GenerateSlotsDto) {
    const date = new Date(dto.date);
    if (isNaN(date.getTime())) throw new BadRequestException('Invalid date');

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayKey = dayNames[date.getUTCDay()];
    const dow = DAY_MAP[dayKey];

    const schedule = await this.prisma.doctorSchedule.findFirst({
      where: { doctorId, facilityId: dto.facilityId, dayOfWeek: dow, isActive: true },
    });

    if (!schedule) {
      throw new NotFoundException(`No schedule found for doctor ${doctorId} on ${dow}`);
    }

    const slots: {
      doctorId: string;
      facilityId: string;
      date: Date;
      startTime: string;
      endTime: string;
      status: SlotStatus;
    }[] = [];
    let cursor = schedule.startTime;
    while (cursor < schedule.endTime) {
      const next = addMinutes(cursor, schedule.slotDurationMinutes);
      if (next > schedule.endTime) break;
      slots.push({
        doctorId,
        facilityId: dto.facilityId,
        date,
        startTime: cursor,
        endTime: next,
        status: SlotStatus.AVAILABLE,
      });
      cursor = next;
    }

    // createMany with skipDuplicates for idempotency
    await this.prisma.appointmentSlot.createMany({ data: slots, skipDuplicates: true });

    return this.prisma.appointmentSlot.findMany({
      where: { doctorId, facilityId: dto.facilityId, date },
      orderBy: { startTime: 'asc' },
    });
  }

  async getSlots(doctorId: string, date: string, facilityId?: string) {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) throw new BadRequestException('Invalid date');

    return this.prisma.appointmentSlot.findMany({
      where: {
        doctorId,
        date: dateObj,
        ...(facilityId ? { facilityId } : {}),
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async updateSlot(slotId: string, dto: UpdateSlotDto) {
    const slot = await this.prisma.appointmentSlot.findUnique({ where: { id: slotId } });
    if (!slot) throw new NotFoundException(`Slot ${slotId} not found`);
    if (slot.status === SlotStatus.BOOKED) {
      throw new ConflictException('Cannot modify a booked slot');
    }
    return this.prisma.appointmentSlot.update({
      where: { id: slotId },
      data: { status: dto.status },
    });
  }
}
