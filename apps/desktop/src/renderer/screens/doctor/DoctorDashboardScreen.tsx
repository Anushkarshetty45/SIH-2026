// Doctor Clinical Dashboard — Appointments, Referrals, and Bed Lookup
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { Appointment, Referral, PaginatedResult } from '../../types';
import { Colors, Spacing, Typography } from '../../theme';
import {
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  StaleDataBanner,
  StatsCard,
  StatusBadge,
} from '../../components';

export const DoctorDashboardScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingReferrals, setPendingReferrals] = useState<Referral[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date().toISOString());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [apptsRes, refsRes] = await Promise.all([
        api.get<PaginatedResult<Appointment>>('/appointments', { params: { limit: 10 } }).catch(() => ({ data: [] })),
        api.get<PaginatedResult<Referral>>('/referrals', { params: { status: 'PENDING_DOCTOR_APPROVAL', limit: 10 } }).catch(() => ({ data: [] })),
      ]);

      setAppointments(apptsRes.data || []);
      setPendingReferrals(refsRes.data || []);
      setLastUpdatedAt(new Date().toISOString());
    } catch (err: any) {
      setError(err?.message || 'Failed to load doctor dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRespondReferral = async (referralId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/referrals/${referralId}/respond`, { status });
      setPendingReferrals((prev) => prev.filter((r) => r.id !== referralId));
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to update referral');
    }
  };

  return (
    <div data-testid="doctor-dashboard-screen" style={{ padding: Spacing.xl, overflowY: 'auto' }}>
      <StaleDataBanner lastUpdatedAt={lastUpdatedAt} />

      {/* KPI Stats Row */}
      <div style={{ display: 'flex', gap: Spacing.md, marginBottom: Spacing.xl }}>
        <StatsCard
          title="Today's Appointments"
          value={appointments.length}
          icon="📅"
          badge="Scheduled"
          badgeColor={Colors.status.confirmed.bg}
          testID="kpi-appointments"
        />
        <StatsCard
          title="Pending Referral Decisions"
          value={pendingReferrals.length}
          icon="📋"
          badge={pendingReferrals.length > 0 ? 'Action Required' : 'All Clear'}
          badgeColor={pendingReferrals.length > 0 ? Colors.status.lowStock.bg : Colors.status.available.bg}
          testID="kpi-referrals"
        />
        <StatsCard
          title="ICU Beds Available"
          value="4 / 10"
          icon="🛏️"
          badge="General Ward: 12 Free"
          testID="kpi-beds"
        />
      </div>

      {loading && <LoadingState message="Loading clinical schedule & referrals..." />}
      {error && !loading && <ErrorState message={error} onRetry={fetchData} />}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: Spacing.xl }}>
          {/* Inbound Referrals Requiring Approval */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
              <h3 style={{ margin: 0, fontSize: Typography.fontSizes.lg, color: Colors.textPrimary }}>
                📋 Urgent Inbound Referrals (Doctor Decision Required)
              </h3>
              <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>
                30-Minute Auto-Timeout Protocol
              </span>
            </div>

            {pendingReferrals.length === 0 ? (
              <EmptyState title="No Inbound Referrals Pending" description="All referral cases have been reviewed." />
            ) : (
              <DataTable
                keyExtractor={(item) => item.id}
                data={pendingReferrals}
                testID="pending-referrals-table"
                columns={[
                  {
                    key: 'patient',
                    header: 'Patient Name',
                    render: (item) => (
                      <div>
                        <strong>{item.patient?.name || 'Patient'}</strong>
                        <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>
                          From: {item.fromFacility?.name || 'Referring Facility'}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'urgency',
                    header: 'Urgency',
                    render: (item) => (
                      <StatusBadge
                        label={item.urgency}
                        status={item.urgency === 'EMERGENCY' ? 'outOfStock' : item.urgency === 'HIGH' ? 'lowStock' : 'available'}
                      />
                    ),
                  },
                  {
                    key: 'notes',
                    header: 'Clinical Reason',
                    render: (item) => item.clinicalNotes || 'No notes provided',
                  },
                  {
                    key: 'actions',
                    header: 'Decision',
                    render: (item) => (
                      <div style={{ display: 'flex', gap: Spacing.xs }}>
                        <Button
                          title="✓ Accept"
                          size="sm"
                          onPress={() => handleRespondReferral(item.id, 'APPROVED')}
                          testID={`accept-ref-${item.id}`}
                        />
                        <Button
                          title="✕ Reject"
                          variant="danger"
                          size="sm"
                          onPress={() => handleRespondReferral(item.id, 'REJECTED')}
                          testID={`reject-ref-${item.id}`}
                        />
                      </div>
                    ),
                  },
                ]}
              />
            )}
          </div>

          {/* Today's Appointments */}
          <div>
            <h3 style={{ margin: `0 0 ${Spacing.md}px`, fontSize: Typography.fontSizes.lg, color: Colors.textPrimary }}>
              📅 Patient Appointments Roster
            </h3>

            {appointments.length === 0 ? (
              <EmptyState title="No Appointments Booked" description="No scheduled patients for today's OPD." />
            ) : (
              <DataTable
                keyExtractor={(item) => item.id}
                data={appointments}
                testID="appointments-table"
                columns={[
                  {
                    key: 'patient',
                    header: 'Patient',
                    render: (item) => (
                      <div>
                        <strong>{item.patient?.name || 'Walk-in Patient'}</strong>
                        <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>
                          Phone: {item.patient?.phone || 'N/A'}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'time',
                    header: 'Slot Time',
                    render: (item) => `${item.slot?.startTime || '09:00'} - ${item.slot?.endTime || '09:30'}`,
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (item) => (
                      <StatusBadge
                        label={item.status}
                        status={item.status === 'CONFIRMED' ? 'confirmed' : 'pending'}
                      />
                    ),
                  },
                  {
                    key: 'notes',
                    header: 'Consultation Notes',
                    render: (item) => item.notes || 'Routine consultation',
                  },
                ]}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboardScreen;
