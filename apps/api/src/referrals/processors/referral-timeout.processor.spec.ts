import { Test, TestingModule } from '@nestjs/testing';
import { ReferralTimeoutProcessor } from './referral-timeout.processor';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ReferralStatus } from '@prisma/client';

describe('ReferralTimeoutProcessor', () => {
  let processor: ReferralTimeoutProcessor;
  let prisma: any;
  let audit: any;
  let notifications: any;

  beforeEach(async () => {
    prisma = {
      referral: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    audit = {
      log: jest.fn().mockResolvedValue(undefined),
    };
    notifications = {
      emit: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralTimeoutProcessor,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    processor = module.get<ReferralTimeoutProcessor>(ReferralTimeoutProcessor);
  });

  it('should transition referral to TIMED_OUT and emit notifications', async () => {
    const mockReferral = {
      id: 'ref-1',
      patientId: 'pat-1',
      createdById: 'user-asha-1',
      fromFacilityId: 'fac-1',
      toFacilityId: 'fac-2',
      status: ReferralStatus.PENDING_DOCTOR_APPROVAL,
      urgency: 'NORMAL',
      timeoutAt: new Date(Date.now() - 1000), // Overdue
    };

    prisma.referral.findUnique.mockResolvedValue(mockReferral);
    prisma.referral.updateMany.mockResolvedValue({ count: 1 });

    await processor.process({ data: { referralId: 'ref-1' } } as any);

    expect(prisma.referral.updateMany).toHaveBeenCalledWith({
      where: { id: 'ref-1', status: ReferralStatus.PENDING_DOCTOR_APPROVAL },
      data: { status: ReferralStatus.TIMED_OUT },
    });
    expect(audit.log).toHaveBeenCalledWith(
      'REFERRAL_TIMED_OUT',
      null,
      'Referral',
      'ref-1',
      expect.any(Object),
    );
    expect(notifications.emit).toHaveBeenCalled();
    expect(notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: 'user-asha-1',
        title: 'Referral Timed Out',
        data: expect.objectContaining({
          idempotencyKey: 'REFERRAL_TIMED_OUT:ref-1:user-asha-1',
        }),
      }),
    );
  });

  it('should do nothing if referral is already approved', async () => {
    prisma.referral.findUnique.mockResolvedValue({
      id: 'ref-1',
      status: ReferralStatus.APPROVED,
    });

    await processor.process({ data: { referralId: 'ref-1' } } as any);

    expect(prisma.referral.updateMany).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
    expect(notifications.emit).not.toHaveBeenCalled();
  });
});
