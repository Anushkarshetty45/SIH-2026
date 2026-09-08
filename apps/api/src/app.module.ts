import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { HealthModule } from './common/health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FacilitiesModule } from './facilities/facilities.module';
import { DoctorsModule } from './doctors/doctors.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ReferralsModule } from './referrals/referrals.module';
import { AvailabilityModule } from './availability/availability.module';
import { InventoryModule } from './inventory/inventory.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { HealthRecordsModule } from './health-records/health-records.module';
import { AmbulanceModule } from './ambulance/ambulance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SyncModule } from './sync/sync.module';
import { AuditModule } from './audit/audit.module';
import appConfig from './config/app.config';

@Module({
  imports: [
    // Configuration — loaded first
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env'],
    }),

    // Common infrastructure
    PrismaModule,
    HealthModule,

    // Domain modules (business logic added in subsequent tasks)
    AuthModule,
    UsersModule,
    FacilitiesModule,
    DoctorsModule,
    AppointmentsModule,
    ReferralsModule,
    AvailabilityModule,
    InventoryModule,
    PrescriptionsModule,
    HealthRecordsModule,
    AmbulanceModule,
    NotificationsModule,
    SyncModule,
    AuditModule,
  ],
})
export class AppModule {}
