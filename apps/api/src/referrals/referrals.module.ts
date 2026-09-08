import { Module } from '@nestjs/common';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import {
  ReferralTimeoutScheduler,
  NoopReferralTimeoutScheduler,
} from './referral-timeout.scheduler';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ReferralsController],
  providers: [
    ReferralsService,
    {
      provide: ReferralTimeoutScheduler,
      useClass: NoopReferralTimeoutScheduler,
    },
  ],
  exports: [ReferralsService, ReferralTimeoutScheduler],
})
export class ReferralsModule {}
