import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventsGateway } from './gateways/events.gateway';
import { getQueueToken } from '@nestjs/bullmq';
import { NOTIFICATIONS_QUEUE } from './processors/notification.processor';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;
  let gateway: any;
  let queueMock: any;

  beforeEach(async () => {
    prisma = {
      notification: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
    };
    gateway = {
      broadcastDomainEvent: jest.fn(),
      sendToUser: jest.fn(),
    };
    queueMock = {
      add: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventsGateway, useValue: gateway },
        { provide: getQueueToken(NOTIFICATIONS_QUEUE), useValue: queueMock },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should create an in-app notification with idempotencyKey and notify via gateway', async () => {
    const mockCreated = {
      id: 'notif-1',
      recipientId: 'user-1',
      title: 'Alert',
      message: 'Hello',
      createdAt: new Date(),
    };
    prisma.notification.create.mockResolvedValue(mockCreated);

    const result = await service.send({
      recipientUserId: 'user-1',
      title: 'Alert',
      message: 'Hello',
      data: { idempotencyKey: 'IDEMP-123' },
    });

    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recipientId: 'user-1',
          idempotencyKey: 'IDEMP-123',
        }),
      }),
    );
    expect(gateway.sendToUser).toHaveBeenCalledWith(
      'user-1',
      'notification:received',
      expect.any(Object),
    );
    expect(result).toEqual(mockCreated);
  });

  it('should return existing notification if idempotencyKey conflicts (P2002)', async () => {
    const errorP2002: any = new Error('Unique constraint failed');
    errorP2002.code = 'P2002';
    prisma.notification.create.mockRejectedValue(errorP2002);

    const existingNotif = { id: 'notif-existing', idempotencyKey: 'IDEMP-DUP' };
    prisma.notification.findUnique.mockResolvedValue(existingNotif);

    const result = await service.send({
      recipientUserId: 'user-1',
      title: 'Alert',
      message: 'Hello',
      data: { idempotencyKey: 'IDEMP-DUP' },
    });

    expect(prisma.notification.findUnique).toHaveBeenCalledWith({
      where: { idempotencyKey: 'IDEMP-DUP' },
    });
    expect(result).toEqual(existingNotif);
  });
});
