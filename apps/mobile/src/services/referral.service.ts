// Referral API Service — integrates with D1 backend /referrals endpoints

import { api } from '../api/client';
import {
  CreateReferralDto,
  RespondReferralDto,
  Referral,
  PaginatedResult,
  PaginationQuery,
} from '../types';

export interface ReferralFilters extends PaginationQuery {
  status?: string;
  patientId?: string;
  fromFacilityId?: string;
  toFacilityId?: string;
}

export const referralService = {
  /**
   * Create a new referral — triggers 30-min doctor response timeout on backend
   */
  create: (dto: CreateReferralDto): Promise<Referral> =>
    api.post<Referral>('/referrals', dto),

  /**
   * List referrals with filters and pagination
   */
  list: (filters?: ReferralFilters): Promise<PaginatedResult<Referral>> =>
    api.get<PaginatedResult<Referral>>('/referrals', { params: filters }),

  /**
   * Get single referral details including audit history
   */
  getById: (id: string): Promise<Referral> =>
    api.get<Referral>(`/referrals/${id}`),

  /**
   * Doctor approves or rejects a referral
   * NOTE: Backend is authoritative. Frontend just dispatches and displays result.
   */
  respond: (id: string, dto: RespondReferralDto): Promise<Referral> =>
    api.patch<Referral>(`/referrals/${id}/respond`, dto),

  /**
   * Cancel a pending referral
   */
  cancel: (id: string): Promise<Referral> =>
    api.patch<Referral>(`/referrals/${id}/cancel`),
};

export default referralService;
