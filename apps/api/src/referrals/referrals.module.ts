import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { ReferralTimeoutScheduler } from './referral-timeout.scheduler';
import {
  BullMQReferralTimeoutScheduler,
  REFERRAL_TIMEOUT_QUEUE,
} from './schedulers/bullmq-referral-timeout.scheduler';
import { ReferralTimeoutProcessor } from './processors/referral-timeout.processor';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    BullModule.registerQueue({
      name: REFERRAL_TIMEOUT_QUEUE,
    }),
  ],
  controllers: [ReferralsController],
  providers: [
    ReferralsService,
    ReferralTimeoutProcessor,
    {
      provide: ReferralTimeoutScheduler,
      useClass: BullMQReferralTimeoutScheduler,
    },
  ],
  exports: [ReferralsService, ReferralTimeoutScheduler],
})
export class ReferralsModule {}
