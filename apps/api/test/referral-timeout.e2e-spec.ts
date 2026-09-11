import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { ReferralTimeoutScheduler } from '../src/referrals/referral-timeout.scheduler';
import { ReferralStatus, UserRole, FacilityType } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('Referral Timeout & Notifications (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let scheduler: ReferralTimeoutScheduler;
  let jwtService: JwtService;
  let configService: ConfigService;
  let ashaUser: any;
  let facilityA: any;
  let facilityB: any;
  let patient: any;
  let ashaToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    scheduler = app.get<ReferralTimeoutScheduler>(ReferralTimeoutScheduler);
    jwtService = app.get<JwtService>(JwtService);
    configService = app.get<ConfigService>(ConfigService);

    // Seed test user, facility, patient
    const unique = Date.now();
    ashaUser = await prisma.user.create({
      data: {
        email: `asha-${unique}@rhcp.dev`,
        name: `ASHA Worker ${unique}`,
        role: UserRole.ASHA_WORKER,
        passwordHash: '$2b$10$hashedpasswordplaceholder',
      },
    });

    facilityA = await prisma.facility.create({
      data: {
        name: `PHC Alpha ${unique}`,
        type: FacilityType.PHC,
        district: 'Pune',
        address: '123 Village St',
        state: 'Maharashtra',
        pincode: '411001',
      },
    });

    facilityB = await prisma.facility.create({
      data: {
        name: `District Hospital Beta ${unique}`,
        type: FacilityType.DISTRICT_HOSPITAL,
        district: 'Pune',
        address: '456 Civil Lines',
        state: 'Maharashtra',
        pincode: '411002',
      },
    });

    patient = await prisma.patient.create({
      data: {
        name: `Test Patient ${unique}`,
        registeredById: ashaUser.id,
      },
    });

    const secret = configService.get<string>('app.jwt.secret') || 'caregrid-jwt-secret-key-2026';
    ashaToken = jwtService.sign(
      { sub: ashaUser.id, email: ashaUser.email, role: ashaUser.role },
      { secret, expiresIn: '1h' },
    );
  });

  afterAll(async () => {
    // Clean up created entities
    try {
      if (ashaUser) {
        await prisma.notification.deleteMany({ where: { recipientId: ashaUser.id } });
        await prisma.referral.deleteMany({ where: { createdById: ashaUser.id } });
        await prisma.patient.deleteMany({ where: { registeredById: ashaUser.id } });
        await prisma.user.delete({ where: { id: ashaUser.id } });
      }
      if (facilityA) await prisma.facility.delete({ where: { id: facilityA.id } });
      if (facilityB) await prisma.facility.delete({ where: { id: facilityB.id } });
    } catch {
      // Ignore cleanup errors
    }
    await app.close();
  });

  it('should process referral timeout in BullMQ, transition status, write audit log, and create idempotent notification', async () => {
    // 1. Create a referral awaiting doctor approval with a test 500ms timeout
    const timeoutAt = new Date(Date.now() + 500);
    const referral = await prisma.referral.create({
      data: {
        patientId: patient.id,
        createdById: ashaUser.id,
        fromFacilityId: facilityA.id,
        toFacilityId: facilityB.id,
        status: ReferralStatus.PENDING_DOCTOR_APPROVAL,
        timeoutAt,
        urgency: 'HIGH',
      },
    });

    // 2. Schedule test delayed timeout (500ms)
    await scheduler.schedule(referral.id, 500);

    // 3. Wait for BullMQ worker to pick up and process the delayed job
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 4. Assert referral transitioned to TIMED_OUT
    const updatedReferral = await prisma.referral.findUnique({
      where: { id: referral.id },
    });
    expect(updatedReferral?.status).toBe(ReferralStatus.TIMED_OUT);

    // 5. Assert audit log was recorded
    const auditLog = await prisma.auditLog.findFirst({
      where: { entityId: referral.id, action: 'REFERRAL_TIMED_OUT' },
    });
    expect(auditLog).toBeDefined();

    // 6. Assert in-app notification was generated for ASHA worker
    const expectedIdempotencyKey = `REFERRAL_TIMED_OUT:${referral.id}:${ashaUser.id}`;
    const notification = await prisma.notification.findUnique({
      where: { idempotencyKey: expectedIdempotencyKey },
    });
    expect(notification).toBeDefined();
    expect(notification?.recipientId).toBe(ashaUser.id);
    expect(notification?.title).toBe('Referral Timed Out');

    // 7. Verify GET /api/v1/notifications endpoint returns the notification
    const res = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${ashaToken}`)
      .expect(200);

    expect(res.body.notifications).toBeDefined();
    expect(res.body.notifications.length).toBeGreaterThanOrEqual(1);
    expect(res.body.notifications[0].id).toBe(notification?.id);

    // 8. Verify PATCH /api/v1/notifications/:id/read endpoint marks it read
    await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${notification?.id}/read`)
      .set('Authorization', `Bearer ${ashaToken}`)
      .expect(200);

    const readNotification = await prisma.notification.findUnique({
      where: { id: notification?.id },
    });
    expect(readNotification?.readAt).toBeDefined();
    expect(readNotification?.status).toBe('READ');
  }, 15000);
});
