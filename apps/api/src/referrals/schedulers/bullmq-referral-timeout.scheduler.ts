import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ReferralTimeoutScheduler } from '../referral-timeout.scheduler';

export const REFERRAL_TIMEOUT_QUEUE = 'referral-timeouts';

@Injectable()
export class BullMQReferralTimeoutScheduler extends ReferralTimeoutScheduler {
  private readonly logger = new Logger(BullMQReferralTimeoutScheduler.name);

  constructor(
    @InjectQueue(REFERRAL_TIMEOUT_QUEUE)
    private readonly timeoutQueue: Queue,
  ) {
    super();
  }

  async schedule(referralId: string, delayMs: number): Promise<void> {
    const jobId = `referral-timeout-${referralId}`;
    this.logger.log(
      `Scheduling referral timeout for ${referralId} with delay ${delayMs}ms (jobId: ${jobId})`,
    );

    await this.timeoutQueue.add(
      'referral-timeout',
      { referralId },
      {
        jobId,
        delay: delayMs,
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );
  }

  async cancel(referralId: string): Promise<void> {
    const jobId = `referral-timeout-${referralId}`;
    this.logger.log(`Cancelling referral timeout for ${referralId} (jobId: ${jobId})`);

    const job = await this.timeoutQueue.getJob(jobId);
    if (job) {
      await job.remove();
      this.logger.log(`Successfully removed timeout job ${jobId}`);
    } else {
      this.logger.debug(`No active timeout job found for ${jobId} to cancel`);
    }
  }
}
