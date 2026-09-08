import { Module } from '@nestjs/common';
import { FreshnessController } from './freshness.controller';
import { FreshnessService } from './freshness.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, NotificationsModule, AuditModule],
  controllers: [FreshnessController],
  providers: [FreshnessService],
  exports: [FreshnessService],
})
export class FreshnessModule {}
