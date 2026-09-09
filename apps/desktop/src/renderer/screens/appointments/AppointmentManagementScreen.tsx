// Desktop Appointment Management Screen
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { Appointment, PaginatedResult } from '../../types';
import { Colors, Spacing, Typography } from '../../theme';
import {
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  StaleDataBanner,
  StatusBadge,
} from '../../components';

export const AppointmentManagementScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date().toISOString());

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PaginatedResult<Appointment>>('/appointments', {
        params: { limit: 50 },
      });
      setAppointments(res.data || []);
      setLastUpdatedAt(new Date().toISOString());
    } catch (err: any) {
      setError(err?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return (
    <div data-testid="appointments-screen" style={{ padding: Spacing.xl, overflowY: 'auto' }}>
      <StaleDataBanner lastUpdatedAt={lastUpdatedAt} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
        <div>
          <h2 style={{ margin: 0, fontSize: Typography.fontSizes.xl, color: Colors.textPrimary }}>
            📅 Doctor Appointments & Schedules
          </h2>
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
            OPD consultation bookings, slot allocations, and patient check-in records
          </span>
        </div>
      </div>

      {loading && <LoadingState message="Loading appointment roster..." />}
      {error && !loading && <ErrorState message={error} onRetry={fetchAppointments} />}

      {!loading && !error && appointments.length === 0 && (
        <EmptyState title="No Appointments Booked" description="No upcoming OPD patient consultations found." />
      )}

      {!loading && !error && appointments.length > 0 && (
        <DataTable
          keyExtractor={(item) => item.id}
          data={appointments}
          testID="appointments-table"
          columns={[
            {
              key: 'patient',
              header: 'Patient Details',
              render: (item) => (
                <div>
                  <strong>{item.patient?.name || 'Walk-in Patient'}</strong>
                  <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>
                    Phone: {item.patient?.phone || 'N/A'} • ABHA: {item.patient?.abhaId || 'N/A'}
                  </div>
                </div>
              ),
            },
            {
              key: 'doctor',
              header: 'Doctor / Specialization',
              render: (item) => (
                <div>
                  <strong>{item.doctor?.name || 'Dr. Medical Officer'}</strong>
                  <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>
                    {item.doctor?.specialization || 'General Medicine'}
                  </div>
                </div>
              ),
            },
            {
              key: 'slot',
              header: 'Scheduled Slot',
              render: (item) => (
                <span>
                  {item.slot?.startTime || '09:00'} - {item.slot?.endTime || '09:30'}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Appointment Status',
              render: (item) => (
                <StatusBadge
                  label={item.status}
                  status={item.status === 'CONFIRMED' ? 'confirmed' : 'pending'}
                />
              ),
            },
            {
              key: 'notes',
              header: 'Clinical Reason',
              render: (item) => item.notes || 'Routine follow-up',
            },
          ]}
        />
      )}
    </div>
  );
};

export default AppointmentManagementScreen;
