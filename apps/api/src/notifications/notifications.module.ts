import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EventsGateway } from './gateways/events.gateway';
import {
  PushNotificationProvider,
  MockPushNotificationProvider,
} from './providers/push-notification.provider';
import { NotificationProcessor, NOTIFICATIONS_QUEUE } from './processors/notification.processor';
import { PrismaModule } from '../common/prisma/prisma.module';

@Global()
@Module({
  imports: [
    PrismaModule,
    JwtModule,
    BullModule.registerQueue({
      name: NOTIFICATIONS_QUEUE,
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    EventsGateway,
    NotificationProcessor,
    {
      provide: PushNotificationProvider,
      useClass: MockPushNotificationProvider,
    },
  ],
  exports: [NotificationsService, EventsGateway, PushNotificationProvider],
})
export class NotificationsModule {}
