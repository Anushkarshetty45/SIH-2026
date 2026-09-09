import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { HealthModule } from './common/health/health.module';
import { RedisModule } from './common/redis/redis.module';
import { QueuesModule } from './common/queues/queues.module';
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
import { PatientsModule } from './patients/patients.module';
import { SyncModule } from './sync/sync.module';
import { AuditModule } from './audit/audit.module';
import { BedsModule } from './beds/beds.module';
import { EquipmentModule } from './equipment/equipment.module';
import { MedicinesModule } from './medicines/medicines.module';
import { FreshnessModule } from './freshness/freshness.module';
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
    RedisModule,
    QueuesModule,

    // Domain modules
    AuthModule,
    UsersModule,
    PatientsModule,
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
    BedsModule,
    EquipmentModule,
    MedicinesModule,
    FreshnessModule,
  ],
})
export class AppModule {}
