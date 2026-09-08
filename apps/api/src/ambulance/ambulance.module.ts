import { Module } from '@nestjs/common';
import { AmbulanceController } from './ambulance.controller';
import { AmbulanceService } from './ambulance.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AmbulanceController],
  providers: [AmbulanceService],
  exports: [AmbulanceService],
})
export class AmbulanceModule {}
