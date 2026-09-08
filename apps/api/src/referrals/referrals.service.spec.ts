import { Test, TestingModule } from '@nestjs/testing';
import { ReferralsService } from './referrals.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { ReferralTimeoutScheduler } from './referral-timeout.scheduler';
import { AuditService } from '../audit/audit.service';
import { ReferralStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('ReferralsService', () => {
  let service: ReferralsService;
  let prisma: any;
  let scheduler: any;
  let audit: any;

  const mockReferral = {
    id: 'ref-1',
    patientId: 'pat-1',
    fromFacilityId: 'fac-1',
    toFacilityId: 'fac-2',
    status: ReferralStatus.PENDING_DOCTOR_APPROVAL,
    urgency: 'NORMAL',
    clinicalNotes: 'Chest pain evaluation',
    createdAt: new Date(),
    updatedAt: new Date(),
    timeoutAt: new Date(Date.now() + 1800000),
  };

  beforeEach(async () => {
    prisma = {
      referral: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    scheduler = {
      schedule: jest.fn().mockResolvedValue(undefined),
      cancel: jest.fn().mockResolvedValue(undefined),
    };

    audit = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ReferralTimeoutScheduler, useValue: scheduler },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<ReferralsService>(ReferralsService);
  });

  it('should create a referral with PENDING_DOCTOR_APPROVAL and schedule timeout', async () => {
    prisma.referral.create.mockResolvedValue(mockReferral);

    const result = await service.create(
      {
        patientId: 'pat-1',
        fromFacilityId: 'fac-1',
        toFacilityId: 'fac-2',
        clinicalNotes: 'Chest pain evaluation',
      },
      'user-asha-1',
    );

    expect(result.status).toBe(ReferralStatus.PENDING_DOCTOR_APPROVAL);
    expect(scheduler.schedule).toHaveBeenCalledWith('ref-1', expect.any(Number));
    expect(audit.log).toHaveBeenCalledWith(
      'REFERRAL_CREATED',
      'user-asha-1',
      'Referral',
      'ref-1',
      expect.any(Object),
    );
  });

  it('should approve a pending referral and cancel timeout', async () => {
    prisma.referral.findUnique.mockResolvedValue(mockReferral);
    prisma.referral.update.mockResolvedValue({
      ...mockReferral,
      status: ReferralStatus.APPROVED,
    });

    const result = await service.respond('ref-1', { status: ReferralStatus.APPROVED }, 'doc-1');

    expect(result.status).toBe(ReferralStatus.APPROVED);
    expect(scheduler.cancel).toHaveBeenCalledWith('ref-1');
    expect(audit.log).toHaveBeenCalledWith(
      'REFERRAL_APPROVED',
      'doc-1',
      'Referral',
      'ref-1',
      expect.any(Object),
    );
  });

  it('should require rejection reason when rejecting a referral', async () => {
    prisma.referral.findUnique.mockResolvedValue(mockReferral);

    await expect(
      service.respond('ref-1', { status: ReferralStatus.REJECTED }, 'doc-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject invalid transition from COMPLETED to APPROVED', async () => {
    prisma.referral.findUnique.mockResolvedValue({
      ...mockReferral,
      status: ReferralStatus.COMPLETED,
    });

    await expect(
      service.respond('ref-1', { status: ReferralStatus.APPROVED }, 'doc-1'),
    ).rejects.toThrow(BadRequestException);
  });
});
