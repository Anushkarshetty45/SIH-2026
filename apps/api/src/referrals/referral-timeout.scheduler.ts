/**
 * ReferralTimeoutScheduler — Integration boundary for Developer 3.
 *
 * This interface defines the contract that the ReferralsService uses to
 * schedule a delayed timeout job. Developer 3 will implement this using
 * BullMQ by providing a concrete class decorated with @Injectable() that
 * this interface is bound to via DI.
 *
 * Developer 3 integration notes:
 *  - Register a BullMQ Queue named 'referral-timeouts'
 *  - Implement ReferralTimeoutSchedulerImpl extends ReferralTimeoutScheduler
 *  - Provide it in ReferralsModule as { provide: ReferralTimeoutScheduler, useClass: ReferralTimeoutSchedulerImpl }
 *  - The job payload is { referralId: string }
 *  - On job execution, call ReferralsService.handleTimeout(referralId)
 *
 * Until Developer 3 provides the implementation, the NoopReferralTimeoutScheduler
 * below is used, which logs a warning but does not crash.
 */
export abstract class ReferralTimeoutScheduler {
  /**
   * Schedule a timeout job for the given referral.
   * @param referralId - ID of the referral to time out
   * @param delayMs - Delay in milliseconds (default: 30 minutes)
   */
  abstract schedule(referralId: string, delayMs: number): Promise<void>;

  /**
   * Cancel a previously scheduled timeout job (e.g. doctor responded in time).
   */
  abstract cancel(referralId: string): Promise<void>;
}

/** Default no-op implementation used until Developer 3 plugs in BullMQ. */
export class NoopReferralTimeoutScheduler extends ReferralTimeoutScheduler {
  async schedule(referralId: string, delayMs: number): Promise<void> {
    // DEPENDENCY: Developer 3 must replace this with a BullMQ implementation
    console.warn(
      `[ReferralTimeout] NOOP — referral ${referralId} timeout in ${delayMs}ms not scheduled. ` +
        'Developer 3 must implement ReferralTimeoutScheduler with BullMQ.',
    );
  }

  async cancel(referralId: string): Promise<void> {
    console.warn(`[ReferralTimeout] NOOP — cancel for referral ${referralId} skipped.`);
  }
}
