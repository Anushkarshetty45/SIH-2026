import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import {
  BullMQReferralTimeoutScheduler,
  REFERRAL_TIMEOUT_QUEUE,
} from './bullmq-referral-timeout.scheduler';

describe('BullMQReferralTimeoutScheduler', () => {
  let scheduler: BullMQReferralTimeoutScheduler;
  let queueMock: {
    add: jest.Mock;
    getJob: jest.Mock;
  };

  beforeEach(async () => {
    queueMock = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
      getJob: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BullMQReferralTimeoutScheduler,
        {
          provide: getQueueToken(REFERRAL_TIMEOUT_QUEUE),
          useValue: queueMock,
        },
      ],
    }).compile();

    scheduler = module.get<BullMQReferralTimeoutScheduler>(BullMQReferralTimeoutScheduler);
  });

  it('should schedule a delayed timeout job with deterministic jobId', async () => {
    const referralId = 'ref-123';
    const delayMs = 1800000;

    await scheduler.schedule(referralId, delayMs);

    expect(queueMock.add).toHaveBeenCalledWith(
      'referral-timeout',
      { referralId },
      expect.objectContaining({
        jobId: `referral-timeout-${referralId}`,
        delay: delayMs,
        removeOnComplete: true,
      }),
    );
  });

  it('should cancel an existing timeout job by removing it', async () => {
    const referralId = 'ref-123';
    const jobMock = { remove: jest.fn().mockResolvedValue(undefined) };
    queueMock.getJob.mockResolvedValue(jobMock);

    await scheduler.cancel(referralId);

    expect(queueMock.getJob).toHaveBeenCalledWith(`referral-timeout-${referralId}`);
    expect(jobMock.remove).toHaveBeenCalled();
  });

  it('should handle cancel gracefully if job does not exist', async () => {
    queueMock.getJob.mockResolvedValue(null);

    await expect(scheduler.cancel('ref-nonexistent')).resolves.not.toThrow();
  });
});
