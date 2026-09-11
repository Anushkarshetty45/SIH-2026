import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, OnModuleDestroy } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { DomainEventType } from '../../notifications/domain-events.interface';
import { ReferralStatus } from '@prisma/client';
import { REFERRAL_TIMEOUT_QUEUE } from '../schedulers/bullmq-referral-timeout.scheduler';

@Processor(REFERRAL_TIMEOUT_QUEUE)
export class ReferralTimeoutProcessor extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(ReferralTimeoutProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  async onModuleDestroy() {
    try {
      await this.worker.close();
    } catch {
      // Ignore worker close errors during teardown
    }
  }

  async process(job: Job<{ referralId: string }>): Promise<void> {
    const { referralId } = job.data;
    this.logger.log(`Processing referral timeout job for referral ${referralId}`);

    const referral = await this.prisma.referral.findUnique({
      where: { id: referralId },
    });

    if (!referral) {
      this.logger.warn(`Referral ${referralId} not found. Skipping timeout.`);
      return;
    }

    if (referral.status !== ReferralStatus.PENDING_DOCTOR_APPROVAL) {
      this.logger.log(
        `Referral ${referralId} is already in status '${referral.status}'. No timeout action needed.`,
      );
      return;
    }

    // Guard against potential clock skew
    if (referral.timeoutAt && new Date() < referral.timeoutAt) {
      const remainingMs = referral.timeoutAt.getTime() - Date.now();
      if (remainingMs > 500) {
        this.logger.warn(
          `Job fired early by ${remainingMs}ms. Re-scheduling for referral ${referralId}`,
        );
        await job.moveToDelayed(Date.now() + remainingMs, job.token);
        return;
      }
    }

    // Atomic conditional transition
    const updateResult = await this.prisma.referral.updateMany({
      where: {
        id: referralId,
        status: ReferralStatus.PENDING_DOCTOR_APPROVAL,
      },
      data: {
        status: ReferralStatus.TIMED_OUT,
      },
    });

    if (updateResult.count === 0) {
      this.logger.log(
        `Referral ${referralId} status transition was already completed concurrently.`,
      );
      return;
    }

    this.logger.log(`Referral ${referralId} marked as TIMED_OUT.`);

    // Audit log
    await this.auditService.log('REFERRAL_TIMED_OUT', null, 'Referral', referralId, {
      fromFacilityId: referral.fromFacilityId,
      toFacilityId: referral.toFacilityId,
      patientId: referral.patientId,
    });

    // Realtime domain event
    await this.notificationsService.emit({
      type: DomainEventType.REFERRAL_TIMED_OUT,
      payload: {
        referralId: referral.id,
        patientId: referral.patientId,
        fromFacilityId: referral.fromFacilityId,
        toFacilityId: referral.toFacilityId,
        receivingDoctorId: referral.receivingDoctorId ?? undefined,
        urgency: referral.urgency,
      },
      occurredAt: new Date(),
    });

    // In-app notification for the referring healthcare worker (ASHA / PHC)
    await this.notificationsService.send({
      recipientUserId: referral.createdById,
      title: 'Referral Timed Out',
      message: `Referral requires immediate action or reassignment due to doctor response timeout.`,
      channel: 'IN_APP',
      data: {
        referralId: referral.id,
        status: ReferralStatus.TIMED_OUT,
        idempotencyKey: `REFERRAL_TIMED_OUT:${referral.id}:${referral.createdById}`,
      },
    });
  }
}
