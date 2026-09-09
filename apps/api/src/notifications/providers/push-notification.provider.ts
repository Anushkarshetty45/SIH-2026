import { Injectable, Logger } from '@nestjs/common';

export interface PushResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export abstract class PushNotificationProvider {
  abstract send(
    recipientUserId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<PushResult>;
}

@Injectable()
export class MockPushNotificationProvider extends PushNotificationProvider {
  private readonly logger = new Logger(MockPushNotificationProvider.name);

  async send(
    recipientUserId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<PushResult> {
    this.logger.log(
      `[MockFCM] Push dispatched to user ${recipientUserId}: "${title}" - ${body} (data: ${JSON.stringify(data ?? {})})`,
    );
    return {
      success: true,
      messageId: `mock-msg-${Date.now()}`,
    };
  }
}
