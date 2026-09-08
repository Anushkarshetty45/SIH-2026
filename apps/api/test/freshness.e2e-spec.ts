import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { UserRole, BedCategory, BedStatus, EquipmentStatus } from '@prisma/client';

describe('Freshness & Escalation Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testFacilityId: string;
  let staleFacilityId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            id: 'test-user-freshness-e2e',
            email: 'admin-freshness@caregrid.org',
            name: 'Freshness Admin',
            role: UserRole.SUPER_ADMIN,
          };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Create test user
    await prisma.user.upsert({
      where: { id: 'test-user-freshness-e2e' },
      create: {
        id: 'test-user-freshness-e2e',
        email: 'freshness-e2e@caregrid.org',
        name: 'Freshness E2E Admin',
        role: UserRole.SUPER_ADMIN,
        passwordHash: '$2b$10$dummyhashedpasswordforfreshnessintegration',
        isActive: true,
      },
      update: {},
    });

    // Create fresh facility
    const freshFacility = await prisma.facility.create({
      data: {
        name: `Fresh RH ${Date.now()}`,
        district: 'Dhule',
        type: 'DISTRICT_HOSPITAL',
        address: 'Shirpur Main Road',
        state: 'Maharashtra',
        pincode: '425405',
        lastUpdatedAt: new Date(),
      },
    });
    testFacilityId = freshFacility.id;

    // Create stale facility (updated 3 hours ago)
    const threeHoursAgo = new Date(Date.now() - 180 * 60 * 1000);
    const staleFacility = await prisma.facility.create({
      data: {
        name: `Stale PHC ${Date.now()}`,
        district: 'Nandurbar',
        type: 'PHC',
        address: 'Dhadgaon Hospital Area',
        state: 'Maharashtra',
        pincode: '425414',
        lastUpdatedAt: threeHoursAgo,
      },
    });
    staleFacilityId = staleFacility.id;

    // Add beds to fresh facility
    await prisma.bed.create({
      data: {
        facilityId: testFacilityId,
        bedNumber: 'ICU-1',
        ward: 'ICU',
        category: BedCategory.ICU,
        status: BedStatus.AVAILABLE,
        lastUpdatedAt: new Date(),
      },
    });

    // Add beds to stale facility
    await prisma.bed.create({
      data: {
        facilityId: staleFacilityId,
        bedNumber: 'STALE-ICU-1',
        ward: 'ICU',
        category: BedCategory.ICU,
        status: BedStatus.AVAILABLE,
        lastUpdatedAt: threeHoursAgo,
      },
    });

    // Add equipment to stale facility
    await prisma.equipment.create({
      data: {
        facilityId: staleFacilityId,
        name: 'ICU Ventilator',
        category: 'LIFE_SUPPORT',
        totalQuantity: 2,
        availableQuantity: 2,
        status: EquipmentStatus.OPERATIONAL,
        lastUpdatedAt: threeHoursAgo,
      },
    });
  });

  afterAll(async () => {
    // Cleanup in order
    await prisma.bed.deleteMany({
      where: { facilityId: { in: [testFacilityId, staleFacilityId] } },
    });
    await prisma.equipment.deleteMany({
      where: { facilityId: { in: [testFacilityId, staleFacilityId] } },
    });
    await prisma.facility.deleteMany({
      where: { id: { in: [testFacilityId, staleFacilityId] } },
    });
    await prisma.user.deleteMany({
      where: { id: 'test-user-freshness-e2e' },
    });
    await app.close();
  });

  describe('GET /api/v1/freshness/facility/:facilityId', () => {
    it('should return CURRENT freshness for recently updated facility', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/freshness/facility/${testFacilityId}`)
        .expect(200);

      expect(res.body.overallFreshness).toBe('CURRENT');
      expect(res.body.emergencyDispatchSafe).toBe(true);
      expect(res.body.beds.isStale).toBe(false);
      expect(res.body.beds.icuAvailable).toBe(1);
    });

    it('should return STALE freshness and life-critical warnings for stale facility', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/freshness/facility/${staleFacilityId}`)
        .expect(200);

      expect(res.body.overallFreshness).toBe('STALE');
      expect(res.body.hasStaleLifeCriticalData).toBe(true);
      expect(res.body.emergencyDispatchSafe).toBe(false);
      expect(res.body.beds.unreliableForEmergency).toBe(true);
      expect(res.body.criticalWarnings.length).toBeGreaterThan(0);
      expect(res.body.criticalWarnings[0]).toContain('STALE AVAILABILITY');
    });
  });

  describe('GET /api/v1/beds/emergency-availability', () => {
    it('should differentiate fresh emergency beds from stale ones', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/beds/emergency-availability')
        .expect(200);

      expect(res.body.facilities).toBeDefined();
      const freshFac = res.body.facilities.find((f: any) => f.facilityId === testFacilityId);
      const staleFac = res.body.facilities.find((f: any) => f.facilityId === staleFacilityId);

      expect(freshFac).toBeDefined();
      expect(freshFac.isStale).toBe(false);
      expect(freshFac.emergencyDispatchSafe).toBe(true);

      expect(staleFac).toBeDefined();
      expect(staleFac.isStale).toBe(true);
      expect(staleFac.unreliableForEmergency).toBe(true);
      expect(staleFac.emergencyDispatchSafe).toBe(false);
      expect(staleFac.criticalWarning).toContain('STALE AVAILABILITY');
    });
  });

  describe('GET /api/v1/freshness/escalations', () => {
    it('should return structured escalation batches for D3 scheduler', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/freshness/escalations?district=Nandurbar')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const staleBatch = res.body.find((b: any) => b.facilityId === staleFacilityId);
      expect(staleBatch).toBeDefined();
      expect(staleBatch.tier).toBe('TIER_1_FACILITY_ADMIN');
      expect(staleBatch.hasLifeCriticalItems).toBe(true);
      expect(staleBatch.items.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/freshness/stale-records', () => {
    it('should query and filter stale records across domains', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/freshness/stale-records?facilityId=${staleFacilityId}`)
        .expect(200);

      expect(res.body.totalStaleRecords).toBeGreaterThan(0);
      expect(res.body.records.some((r: any) => r.resourceType === 'BEDS')).toBe(true);
      expect(res.body.records.some((r: any) => r.resourceType === 'EQUIPMENT')).toBe(true);
    });
  });

  describe('POST /api/v1/freshness/trigger-events', () => {
    it('should emit domain events and return emitted count for D3', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/freshness/trigger-events?district=Nandurbar')
        .expect(201);

      expect(res.body.emittedCount).toBeGreaterThan(0);
      expect(res.body.events).toBeDefined();
      expect(res.body.events.some((e: any) => e.type === 'escalation.triggered')).toBe(true);
    });
  });
});
