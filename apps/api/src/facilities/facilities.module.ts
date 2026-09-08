import { Module } from '@nestjs/common';
import { FacilitiesController } from './facilities.controller';
import { FacilitiesService } from './facilities.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FacilitiesController],
  providers: [FacilitiesService],
  exports: [FacilitiesService],
})
export class FacilitiesModule {}
