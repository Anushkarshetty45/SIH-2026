// Appointment API Service — integrates with D1 backend /appointments + /availability endpoints

import { api } from '../api/client';
import {
  Appointment,
  AppointmentSlot,
  BookAppointmentDto,
  PaginatedResult,
  PaginationQuery,
} from '../types';

export interface SlotFilters {
  doctorId: string;
  facilityId?: string;
  date?: string; // ISO date YYYY-MM-DD
}

export interface AppointmentFilters extends PaginationQuery {
  status?: string;
  patientId?: string;
  doctorId?: string;
  facilityId?: string;
}

export const appointmentService = {
  /**
   * Get available appointment slots for a doctor
   * Returns AVAILABLE slots only — backend filters BOOKED/BLOCKED
   */
  getAvailableSlots: (filters: SlotFilters): Promise<AppointmentSlot[]> =>
    api.get<AppointmentSlot[]>('/availability/slots', {
      params: { ...filters, status: 'AVAILABLE' },
    }),

  /**
   * Book an appointment slot with pessimistic lock (backend-enforced concurrency)
   * Backend returns HTTP 409 if the slot was taken concurrently.
   * Frontend MUST handle 409 by refreshing slots and showing conflict message.
   */
  book: (dto: BookAppointmentDto): Promise<Appointment> =>
    api.post<Appointment>('/appointments', dto),

  /**
   * List appointments with filters
   */
  list: (filters?: AppointmentFilters): Promise<PaginatedResult<Appointment>> =>
    api.get<PaginatedResult<Appointment>>('/appointments', { params: filters }),

  /**
   * Get single appointment details
   */
  getById: (id: string): Promise<Appointment> =>
    api.get<Appointment>(`/appointments/${id}`),

  /**
   * Cancel an appointment — frees the reserved slot
   */
  cancel: (id: string): Promise<Appointment> =>
    api.patch<Appointment>(`/appointments/${id}/cancel`),
};

export default appointmentService;
