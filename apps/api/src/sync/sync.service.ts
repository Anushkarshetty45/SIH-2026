import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PullSyncDto, PushSyncDto, PushMutationDto, SyncEntity, SyncAction } from './dto/sync.dto';
import { AuditService } from '../audit/audit.service';
import { ReferralStatus, AppointmentStatus, SlotStatus } from '@prisma/client';

export interface MutationResult {
  id: string;
  status: 'SYNCED' | 'CONFLICT' | 'ERROR';
  error?: string;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Pull delta changes since a given timestamp.
   * Optimized for 2G bandwidth: compact payload, only changed records.
   */
  async pull(query: PullSyncDto) {
    const sinceDate = query.since ? new Date(query.since) : new Date(0);
    const serverTimestamp = new Date().toISOString();

    const [facilities, doctors, patients, referrals, appointments] = await Promise.all([
      this.prisma.facility.findMany({
        where: { lastUpdatedAt: { gte: sinceDate } },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          district: true,
          state: true,
          contactPhone: true,
          lastUpdatedAt: true,
        },
      }),
      this.prisma.doctor.findMany({
        where: { updatedAt: { gte: sinceDate } },
        select: {
          id: true,
          userId: true,
          facilityId: true,
          specialization: true,
          registrationNo: true,
          isAvailable: true,
          updatedAt: true,
          user: { select: { name: true } },
        },
      }),
      this.prisma.patient.findMany({
        where: { updatedAt: { gte: sinceDate } },
        select: {
          id: true,
          name: true,
          phone: true,
          gender: true,
          dateOfBirth: true,
          district: true,
          state: true,
          abhaId: true,
          preferredLanguage: true,
          consentStatus: true,
          updatedAt: true,
        },
      }),
      this.prisma.referral.findMany({
        where: { updatedAt: { gte: sinceDate } },
        select: {
          id: true,
          patientId: true,
          fromFacilityId: true,
          toFacilityId: true,
          receivingDoctorId: true,
          status: true,
          urgency: true,
          clinicalNotes: true,
          updatedAt: true,
        },
      }),
      this.prisma.appointment.findMany({
        where: { updatedAt: { gte: sinceDate } },
        select: {
          id: true,
          patientId: true,
          doctorId: true,
          facilityId: true,
          slotId: true,
          status: true,
          notes: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      serverTimestamp,
      deltas: {
        facilities,
        doctors,
        patients,
        referrals,
        appointments,
      },
    };
  }

  /**
   * Push batch mutations from mobile or Raspberry Pi edge nodes.
   * Handles idempotency and logs each synced operation.
   */
  async push(dto: PushSyncDto, actorId: string) {
    const results: MutationResult[] = [];

    for (const mutation of dto.mutations) {
      try {
        // Idempotency check: see if mutation ID was already processed
        const existingLog = await this.prisma.auditLog.findFirst({
          where: {
            action: `SYNC_MUTATION_${mutation.id}`,
          },
        });

        if (existingLog) {
          results.push({ id: mutation.id, status: 'SYNCED' });
          continue;
        }

        await this.processMutation(mutation, actorId);

        await this.auditService.log(
          `SYNC_MUTATION_${mutation.id}`,
          actorId,
          mutation.entity,
          mutation.payload.id || mutation.id,
          { clientTimestamp: mutation.clientTimestamp },
        );

        results.push({ id: mutation.id, status: 'SYNCED' });
      } catch (err: any) {
        this.logger.error(`Sync mutation failed for ${mutation.id}: ${err.message}`, err.stack);
        results.push({
          id: mutation.id,
          status: err.status === 409 ? 'CONFLICT' : 'ERROR',
          error: err.message,
        });
      }
    }

    return { results, processedAt: new Date().toISOString() };
  }

  private async processMutation(mutation: PushMutationDto, actorId: string) {
    const { entity, action, payload } = mutation;

    switch (entity) {
      case SyncEntity.PATIENT:
        if (action === SyncAction.CREATE) {
          await this.prisma.patient.upsert({
            where: { id: payload.id || 'new' },
            create: {
              ...(payload.id && { id: payload.id }),
              name: payload.name,
              phone: payload.phone,
              gender: payload.gender,
              dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : null,
              district: payload.district,
              state: payload.state,
              address: payload.address,
              abhaId: payload.abhaId || null,
              preferredLanguage: payload.preferredLanguage || 'MARATHI',
              registeredById: actorId,
            },
            update: {
              name: payload.name,
              phone: payload.phone,
              district: payload.district,
              state: payload.state,
              address: payload.address,
            },
          });
        }
        break;

      case SyncEntity.REFERRAL:
        if (action === SyncAction.CREATE) {
          await this.prisma.referral.upsert({
            where: { id: payload.id || 'new' },
            create: {
              ...(payload.id && { id: payload.id }),
              patientId: payload.patientId,
              fromFacilityId: payload.fromFacilityId,
              toFacilityId: payload.toFacilityId,
              receivingDoctorId: payload.receivingDoctorId || null,
              urgency: payload.urgency || 'NORMAL',
              clinicalNotes: payload.clinicalNotes,
              status: payload.status || ReferralStatus.PENDING_DOCTOR_APPROVAL,
              createdById: actorId,
            },
            update: {
              clinicalNotes: payload.clinicalNotes,
            },
          });
        }
        break;

      case SyncEntity.APPOINTMENT:
        if (action === SyncAction.CREATE) {
          // If slotId is passed, mark slot booked
          if (payload.slotId) {
            await this.prisma.appointmentSlot.update({
              where: { id: payload.slotId },
              data: { status: SlotStatus.BOOKED },
            });
          }

          await this.prisma.appointment.upsert({
            where: { id: payload.id || 'new' },
            create: {
              ...(payload.id && { id: payload.id }),
              patientId: payload.patientId,
              doctorId: payload.doctorId,
              facilityId: payload.facilityId,
              slotId: payload.slotId,
              referralId: payload.referralId || null,
              notes: payload.notes,
              status: AppointmentStatus.SCHEDULED,
            },
            update: {
              notes: payload.notes,
            },
          });
        }
        break;

      default:
        throw new BadRequestException(`Unsupported sync entity: ${entity}`);
    }
  }
}
