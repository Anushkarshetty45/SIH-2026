import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, OnModuleDestroy } from '@nestjs/common';
import { Job } from 'bullmq';
import { PushNotificationProvider } from '../providers/push-notification.provider';

export const NOTIFICATIONS_QUEUE = 'notifications';

export interface SendPushJobData {
  recipientUserId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationProcessor extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly pushProvider: PushNotificationProvider) {
    super();
  }

  async onModuleDestroy() {
    try {
      await this.worker.close();
    } catch {
      // Ignore worker close errors during teardown
    }
  }

  async process(job: Job<SendPushJobData>): Promise<void> {
    const { recipientUserId, title, body, data } = job.data;
    this.logger.log(`Processing push notification job ${job.id} for user ${recipientUserId}`);

    try {
      const result = await this.pushProvider.send(recipientUserId, title, body, data);
      if (!result.success) {
        this.logger.warn(`Push notification failed for user ${recipientUserId}: ${result.error}`);
      }
    } catch (err: any) {
      this.logger.error(
        `Error sending push notification to user ${recipientUserId}: ${err.message}`,
      );
      throw err; // Allow BullMQ retry strategy
    }
  }
}
