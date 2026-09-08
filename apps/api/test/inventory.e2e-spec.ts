import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { UserRole } from '@prisma/client';

describe('Medicine & Inventory Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testFacilityId: string;
  let testMedicineId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            id: 'test-user-e2e',
            email: 'admin@caregrid.org',
            name: 'CareGrid Admin',
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

    // Ensure a test user exists in PostgreSQL for foreign key constraints
    await prisma.user.upsert({
      where: { id: 'test-user-e2e' },
      create: {
        id: 'test-user-e2e',
        email: 'e2e-admin@caregrid.org',
        name: 'CareGrid Admin',
        role: UserRole.SUPER_ADMIN,
        passwordHash: '$2b$10$dummyhashedpasswordforintegrationtesting',
        isActive: true,
      },
      update: {},
    });

    // Ensure a test facility exists in PostgreSQL
    const facility = await prisma.facility.upsert({
      where: { id: 'test-e2e-facility' },
      create: {
        id: 'test-e2e-facility',
        name: 'Baramati Rural Health Center',
        type: 'PHC',
        status: 'ACTIVE',
        address: 'Baramati Taluka',
        district: 'Pune',
        state: 'Maharashtra',
        pincode: '413102',
        contactPhone: '+919876543210',
      },
      update: {},
    });
    testFacilityId = facility.id;
  });

  afterAll(async () => {
    try {
      if (testFacilityId) {
        await prisma.stockTransaction.deleteMany({
          where: { facilityId: testFacilityId },
        });
        await prisma.medicineStock.deleteMany({
          where: { facilityId: testFacilityId },
        });
      }
      if (testMedicineId) {
        await prisma.medicineAlternative.deleteMany({
          where: {
            OR: [{ medicineId: testMedicineId }, { alternativeMedicineId: testMedicineId }],
          },
        });
        await prisma.medicine.deleteMany({
          where: { id: testMedicineId },
        });
      }
      await prisma.facility.deleteMany({
        where: { id: 'test-e2e-facility' },
      });
      await prisma.user.deleteMany({
        where: { id: 'test-user-e2e' },
      });
    } finally {
      await app.close();
    }
  });

  it('1. POST /api/v1/medicines registers a medicine', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/medicines')
      .send({
        name: 'Cetirizine 10mg E2E',
        genericName: 'Cetirizine Hydrochloride',
        dosageForm: 'TABLET',
        strength: '10mg',
        category: 'Antihistamine',
        manufacturer: 'CareLabs India',
        unit: 'tablets',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Cetirizine 10mg E2E');
    expect(res.body.dosageForm).toBe('TABLET');
    testMedicineId = res.body.id;
  });

  it('2. GET /api/v1/medicines queries catalog', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/medicines?search=Cetirizine')
      .expect(200);

    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
    const found = res.body.items.some((m: { id: string }) => m.id === testMedicineId);
    expect(found).toBe(true);
  });

  it('3. POST /api/v1/inventory/intake adds initial stock', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/inventory/intake')
      .send({
        facilityId: testFacilityId,
        medicineId: testMedicineId,
        quantity: 100,
        unit: 'tablets',
        batchNumber: 'BATCH-2026-E2E',
        supplier: 'State Medical Supply Depot',
        notes: 'Initial consignment',
      })
      .expect(201);

    expect(res.body.stock.currentStock).toBe(100);
    expect(res.body.transaction.type).toBe('RECEIPT');
    expect(res.body.transaction.quantity).toBe(100);
  });

  it('4. GET /api/v1/facilities/:facilityId/inventory/:medicineId verifies stock level', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/facilities/${testFacilityId}/inventory/${testMedicineId}`)
      .expect(200);

    expect(res.body.currentStock).toBe(100);
    expect(res.body.isStale).toBe(false);
    expect(res.body.Transactions).toHaveLength(1);
  });

  it('5. POST /api/v1/inventory/adjust successfully decrements stock (ISSUE)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/inventory/adjust')
      .send({
        facilityId: testFacilityId,
        medicineId: testMedicineId,
        type: 'ISSUE',
        quantity: 35,
        notes: 'Dispensed to OPD patient',
      })
      .expect(200);

    expect(res.body.stock.currentStock).toBe(65);
    expect(res.body.transaction.balanceAfter).toBe(65);
  });

  it('6. POST /api/v1/inventory/adjust rejects invalid negative stock (Negative-Stock Protection)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/inventory/adjust')
      .send({
        facilityId: testFacilityId,
        medicineId: testMedicineId,
        type: 'ISSUE',
        quantity: 100, // Available is only 65
      })
      .expect(400);

    expect(res.body.message).toContain('Insufficient stock');
  });

  it('7. GET /api/v1/inventory/check returns status and freshness at prescription-time', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/inventory/check?facilityId=${testFacilityId}&medicineId=${testMedicineId}`)
      .expect(200);

    expect(res.body.currentStock).toBe(65);
    expect(res.body.status).toBe('AVAILABLE');
    expect(res.body.isStale).toBe(false);
    expect(res.body.clinicalNote).toBeDefined();
  });

  it('8. GET /api/v1/facilities/:facilityId/inventory returns facility summary breakdown', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/facilities/${testFacilityId}/inventory`)
      .expect(200);

    expect(res.body.facilityId).toBe(testFacilityId);
    expect(res.body.summary.totalItems).toBeGreaterThanOrEqual(1);
    expect(res.body.summary.availableItems).toBeGreaterThanOrEqual(1);
    expect(res.body.items).toHaveLength(1);
  });

  it('9. POST /api/v1/inventory/intake is idempotent when idempotencyKey is supplied', async () => {
    const idempotencyKey = 'intake-key-unique-e2e-001';

    // First call
    const res1 = await request(app.getHttpServer())
      .post('/api/v1/inventory/intake')
      .send({
        facilityId: testFacilityId,
        medicineId: testMedicineId,
        quantity: 20,
        idempotencyKey,
      })
      .expect(201);

    expect(res1.body.stock.currentStock).toBe(85); // 65 + 20
    expect(res1.body.idempotentReplay).toBe(false);

    // Duplicate call with same idempotencyKey (e.g. 2G network retry)
    const res2 = await request(app.getHttpServer())
      .post('/api/v1/inventory/intake')
      .send({
        facilityId: testFacilityId,
        medicineId: testMedicineId,
        quantity: 20,
        idempotencyKey,
      })
      .expect(201);

    expect(res2.body.idempotentReplay).toBe(true);
    expect(res2.body.stock.currentStock).toBe(85); // Stock was NOT doubled!
  });

  it('10. POST /api/v1/inventory/import processes valid rows and reports row-level errors', async () => {
    const importKey = 'import-key-unique-e2e-001';

    const res = await request(app.getHttpServer())
      .post('/api/v1/inventory/import')
      .send({
        facilityId: testFacilityId,
        idempotencyKey: importKey,
        rows: [
          { rowNumber: 1, medicineId: testMedicineId, quantity: 40 },
          { rowNumber: 2, medicineName: 'Completely Nonexistent Drug XYZ', quantity: 15 },
          { rowNumber: 3, medicineId: testMedicineId, quantity: -5 },
        ],
      })
      .expect(200);

    expect(res.body.totalRows).toBe(3);
    expect(res.body.successfulRows).toBe(1);
    expect(res.body.failedRows).toBe(2);
    expect(res.body.errors).toHaveLength(2);
    expect(res.body.errors[0].row).toBe(2);
    expect(res.body.errors[1].row).toBe(3);

    // Verify stock incremented by exactly 40 (85 + 40 = 125)
    const stockRes = await request(app.getHttpServer())
      .get(`/api/v1/facilities/${testFacilityId}/inventory/${testMedicineId}`)
      .expect(200);
    expect(stockRes.body.currentStock).toBe(125);
  });

  it('11. POST /api/v1/inventory/import provides safe idempotent replay on network retry', async () => {
    const importKey = 'import-key-unique-e2e-001';

    // Retry same import batch
    const res = await request(app.getHttpServer())
      .post('/api/v1/inventory/import')
      .send({
        facilityId: testFacilityId,
        idempotencyKey: importKey,
        rows: [{ rowNumber: 1, medicineId: testMedicineId, quantity: 40 }],
      })
      .expect(200);

    expect(res.body.idempotentReplay).toBe(true);
    expect(res.body.totalRows).toBe(3);

    // Confirm stock was NOT incremented again
    const stockRes = await request(app.getHttpServer())
      .get(`/api/v1/facilities/${testFacilityId}/inventory/${testMedicineId}`)
      .expect(200);
    expect(stockRes.body.currentStock).toBe(125);
  });

  it('12. POST /api/v1/prescriptions/check-availability validates multi-item prescription', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/prescriptions/check-availability')
      .send({
        facilityId: testFacilityId,
        items: [{ medicineId: testMedicineId, quantity: 20 }],
      })
      .expect(200);

    expect(res.body.facilityId).toBe(testFacilityId);
    expect(res.body.allAvailable).toBe(true);
    expect(res.body.items[0].canFulfill).toBe(true);
    expect(res.body.items[0].currentStock).toBe(125);
    expect(res.body.clinicalWarning).toBeDefined();
  });

  it('13. GET /api/v1/medicines/:id/alternatives returns deterministic alternatives with facility stock', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/medicines/${testMedicineId}/alternatives?facilityId=${testFacilityId}`)
      .expect(200);

    expect(res.body).toHaveProperty('controlledAlternatives');
    expect(res.body).toHaveProperty('genericEquivalents');
    expect(res.body.substitutionRule).toBe('DETERMINISTIC_CONTROLLED_ONLY');
    expect(res.body.clinicalNote).toContain(
      'Alternative available does NOT mean automatic substitution',
    );
  });
});
