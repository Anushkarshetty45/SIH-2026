import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ReferralStatus } from '@prisma/client';
import {
  CreateReferralDto,
  RespondReferralDto,
  CancelReferralDto,
  ReferralQueryDto,
} from './dto/referral.dto';
import { ReferralTimeoutScheduler } from './referral-timeout.scheduler';
import { AuditService } from '../audit/audit.service';

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/** Valid state transitions */
const ALLOWED_TRANSITIONS: Partial<Record<ReferralStatus, ReferralStatus[]>> = {
  [ReferralStatus.PENDING_DOCTOR_APPROVAL]: [
    ReferralStatus.APPROVED,
    ReferralStatus.REJECTED,
    ReferralStatus.TIMED_OUT,
    ReferralStatus.CANCELLED,
  ],
  [ReferralStatus.APPROVED]: [ReferralStatus.COMPLETED, ReferralStatus.CANCELLED],
};

const REFERRAL_SELECT = {
  id: true,
  status: true,
  urgency: true,
  clinicalNotes: true,
  rejectionReason: true,
  timeoutAt: true,
  respondedAt: true,
  createdAt: true,
  updatedAt: true,
  patient: { select: { id: true, name: true, abhaId: true } },
  createdBy: { select: { id: true, name: true, role: true } },
  fromFacility: { select: { id: true, name: true, type: true, district: true } },
  toFacility: { select: { id: true, name: true, type: true, district: true } },
  receivingDoctor: { select: { id: true, specialization: true, user: { select: { name: true } } } },
};

@Injectable()
export class ReferralsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly timeoutScheduler: ReferralTimeoutScheduler,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateReferralDto, createdById: string) {
    const timeoutAt = new Date(Date.now() + DEFAULT_TIMEOUT_MS);

    const referral = await this.prisma.referral.create({
      data: {
        ...dto,
        createdById,
        timeoutAt,
        status: ReferralStatus.PENDING_DOCTOR_APPROVAL,
      },
      select: REFERRAL_SELECT,
    });

    // Enqueue timeout job (Developer 3 implements actual BullMQ worker)
    await this.timeoutScheduler.schedule(referral.id, DEFAULT_TIMEOUT_MS);

    await this.auditService.log('REFERRAL_CREATED', createdById, 'Referral', referral.id, {
      patientId: dto.patientId,
      toFacilityId: dto.toFacilityId,
    });

    return referral;
  }

  async findById(id: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { id },
      select: REFERRAL_SELECT,
    });
    if (!referral) throw new NotFoundException(`Referral ${id} not found`);
    return referral;
  }

  async list(query: ReferralQueryDto, _actorId?: string) {
    const page = Number(query.page ?? 1);
    const limit = Math.min(Number(query.limit ?? 20), 100);
    const skip = (page - 1) * limit;

    const where = {
      ...(query.status && { status: query.status }),
      ...(query.patientId && { patientId: query.patientId }),
    };

    const [referrals, total] = await Promise.all([
      this.prisma.referral.findMany({
        where,
        skip,
        take: limit,
        select: REFERRAL_SELECT,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.referral.count({ where }),
    ]);
    return { referrals, total, page, limit };
  }

  async respond(id: string, dto: RespondReferralDto, respondingDoctorId: string) {
    const referral = await this.findById(id);
    this.assertTransition(referral.status, dto.status);

    if (dto.status === ReferralStatus.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException('rejectionReason is required when rejecting a referral');
    }

    const updated = await this.prisma.referral.update({
      where: { id },
      data: {
        status: dto.status,
        respondingDoctorId,
        respondedAt: new Date(),
        rejectionReason: dto.rejectionReason,
      },
      select: REFERRAL_SELECT,
    });

    // Cancel the timeout job since doctor responded
    await this.timeoutScheduler.cancel(id);

    await this.auditService.log(
      dto.status === ReferralStatus.APPROVED ? 'REFERRAL_APPROVED' : 'REFERRAL_REJECTED',
      respondingDoctorId,
      'Referral',
      id,
      { reason: dto.rejectionReason },
    );

    return updated;
  }

  async cancel(id: string, dto: CancelReferralDto, actorId: string) {
    const referral = await this.findById(id);
    this.assertTransition(referral.status, ReferralStatus.CANCELLED);

    const updated = await this.prisma.referral.update({
      where: { id },
      data: { status: ReferralStatus.CANCELLED, rejectionReason: dto.reason },
      select: REFERRAL_SELECT,
    });

    await this.timeoutScheduler.cancel(id);
    await this.auditService.log('REFERRAL_CANCELLED', actorId, 'Referral', id, {
      reason: dto.reason,
    });

    return updated;
  }

  /**
   * Called by Developer 3's BullMQ worker when the timeout job fires.
   * Transitions referral to TIMED_OUT only if still PENDING_DOCTOR_APPROVAL.
   */
  async handleTimeout(referralId: string) {
    const referral = await this.prisma.referral.findUnique({ where: { id: referralId } });
    if (!referral || referral.status !== ReferralStatus.PENDING_DOCTOR_APPROVAL) return;

    await this.prisma.referral.update({
      where: { id: referralId },
      data: { status: ReferralStatus.TIMED_OUT },
    });

    await this.auditService.log('REFERRAL_TIMED_OUT', null, 'Referral', referralId, {});
  }

  private assertTransition(current: ReferralStatus, next: ReferralStatus) {
    const allowed = ALLOWED_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(`Invalid state transition: ${current} → ${next}`);
    }
  }
}
