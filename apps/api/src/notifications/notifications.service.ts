import { Injectable, Logger } from '@nestjs/common';
import { DomainEvent } from './domain-events.interface';

export interface NotificationPayload {
  recipientUserId: string;
  title: string;
  message: string;
  channel?: 'SMS' | 'PUSH' | 'SOCKET';
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  /**
   * Dispatches domain event to active listeners.
   * Developer 3 integrates this with WebSocket gateway and BullMQ SMS queue.
   */
  async emit(event: DomainEvent): Promise<void> {
    this.logger.log(`[DomainEvent] ${event.type} emitted at ${event.occurredAt.toISOString()}`);
    // Developer 3 integration hook: trigger WS push / queue SMS
  }

  /**
   * Direct notification send helper.
   * Logs or queues message based on recipient user channel.
   */
  async send(payload: NotificationPayload): Promise<void> {
    this.logger.log(
      `[Notification] To ${payload.recipientUserId} via ${payload.channel || 'ALL'}: ${payload.title} - ${payload.message}`,
    );
  }
}
