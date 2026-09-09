import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventsGateway } from './gateways/events.gateway';
import { DomainEvent } from './domain-events.interface';
import { NotificationQueryDto } from './dto/notification.dto';
import { NotificationChannel, NotificationStatus, Notification } from '@prisma/client';
import { NOTIFICATIONS_QUEUE, SendPushJobData } from './processors/notification.processor';

export interface NotificationPayload {
  recipientUserId: string;
  title: string;
  message: string;
  channel?: 'IN_APP' | 'PUSH' | 'SOCKET';
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
    @InjectQueue(NOTIFICATIONS_QUEUE)
    private readonly notificationsQueue: Queue<SendPushJobData>,
  ) {}

  /**
   * Dispatches a domain event to active real-time WebSocket listeners.
   */
  async emit(event: DomainEvent): Promise<void> {
    this.logger.log(`[DomainEvent] ${event.type} emitted at ${event.occurredAt.toISOString()}`);
    this.eventsGateway.broadcastDomainEvent(event);
  }

  /**
   * Persists an in-app notification with deterministic idempotency,
   * pushes it to real-time WebSockets if connected, and queues external push if requested.
   */
  async send(payload: NotificationPayload): Promise<Notification | null> {
    const idempotencyKey =
      (payload.data?.idempotencyKey as string) ||
      `NOTIF:${payload.recipientUserId}:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`;

    const channelEnum =
      payload.channel === 'PUSH'
        ? NotificationChannel.PUSH
        : payload.channel === 'SOCKET'
          ? NotificationChannel.SOCKET
          : NotificationChannel.IN_APP;

    try {
      const notification = await this.prisma.notification.create({
        data: {
          recipientId: payload.recipientUserId,
          title: payload.title,
          message: payload.message,
          channel: channelEnum,
          status: NotificationStatus.SENT,
          idempotencyKey,
          data: payload.data ?? undefined,
        },
      });

      this.logger.log(
        `[Notification] Created notification ${notification.id} for user ${payload.recipientUserId}`,
      );

      // Real-time dispatch to user personal room
      this.eventsGateway.sendToUser(payload.recipientUserId, 'notification:received', {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        createdAt: notification.createdAt,
        data: notification.data,
      });

      // Async push queue dispatch if PUSH requested
      if (payload.channel === 'PUSH') {
        await this.notificationsQueue.add('send-push', {
          recipientUserId: payload.recipientUserId,
          title: payload.title,
          body: payload.message,
          data: payload.data,
        });
      }

      return notification;
    } catch (err: any) {
      if (err.code === 'P2002') {
        this.logger.warn(
          `[Notification] Duplicate notification suppressed by idempotency key: ${idempotencyKey}`,
        );
        return this.prisma.notification.findUnique({
          where: { idempotencyKey },
        });
      }
      this.logger.error(`[Notification] Failed to create notification: ${err.message}`);
      throw err;
    }
  }

  /**
   * Queries paginated notifications for the current authenticated user.
   */
  async listUserNotifications(userId: string, query: NotificationQueryDto) {
    const page = Number(query.page ?? 1);
    const limit = Math.min(Number(query.limit ?? 20), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      recipientId: userId,
    };

    if (query.unreadOnly) {
      where.readAt = null;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { recipientId: userId, readAt: null },
      }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Marks a notification as read, ensuring authorization.
   */
  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    if (notification.recipientId !== userId) {
      throw new ForbiddenException('You are not authorized to access this notification');
    }

    return this.prisma.notification.update({
      where: { id },
      data: {
        readAt: new Date(),
        status: NotificationStatus.READ,
      },
    });
  }
}
