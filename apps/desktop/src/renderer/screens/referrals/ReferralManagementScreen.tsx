// Desktop Referral Management Screen — Inbound & Outbound Patient Transfers
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { Referral, PaginatedResult } from '../../types';
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

export const ReferralManagementScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date().toISOString());
  const [filter, setFilter] = useState<string>('ALL');

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PaginatedResult<Referral>>('/referrals', {
        params: { limit: 50, status: filter === 'ALL' ? undefined : filter },
      });
      setReferrals(res.data || []);
      setLastUpdatedAt(new Date().toISOString());
    } catch (err: any) {
      setError(err?.message || 'Failed to load referrals');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const handleAction = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/referrals/${id}/respond`, { status: action });
      fetchReferrals();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to respond to referral');
    }
  };

  return (
    <div data-testid="referrals-screen" style={{ padding: Spacing.xl, overflowY: 'auto' }}>
      <StaleDataBanner lastUpdatedAt={lastUpdatedAt} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
        <div>
          <h2 style={{ margin: 0, fontSize: Typography.fontSizes.xl, color: Colors.textPrimary }}>
            📋 Cross-Tier Patient Referrals
          </h2>
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
            Inbound PHC-to-District hospital requests, doctor approvals, and emergency transfers
          </span>
        </div>

        <div style={{ display: 'flex', gap: Spacing.xs }}>
          {['ALL', 'PENDING_DOCTOR_APPROVAL', 'APPROVED', 'REJECTED', 'TIMED_OUT'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              data-testid={`filter-${st}`}
              style={{
                padding: `${Spacing.xs}px ${Spacing.sm}px`,
                borderRadius: Spacing.borderRadius.full,
                border: `1px solid ${filter === st ? Colors.primary : Colors.border}`,
                backgroundColor: filter === st ? Colors.primary : Colors.surface,
                color: filter === st ? '#FFF' : Colors.textSecondary,
                fontSize: Typography.fontSizes.xs,
                cursor: 'pointer',
              }}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading && <LoadingState message="Loading referrals ledger..." />}
      {error && !loading && <ErrorState message={error} onRetry={fetchReferrals} />}

      {!loading && !error && referrals.length === 0 && (
        <EmptyState title="No Referrals Logged" description="No patient transfers match your selected status." />
      )}

      {!loading && !error && referrals.length > 0 && (
        <DataTable
          keyExtractor={(item) => item.id}
          data={referrals}
          testID="referrals-table"
          columns={[
            {
              key: 'patient',
              header: 'Patient Details',
              render: (item) => (
                <div>
                  <strong>{item.patient?.name || 'Patient'}</strong>
                  <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>
                    ABHA: {item.patient?.abhaId || 'N/A'} • {item.patient?.gender || ''}
                  </div>
                </div>
              ),
            },
            {
              key: 'facilities',
              header: 'Route (From → To)',
              render: (item) => (
                <div style={{ fontSize: Typography.fontSizes.xs }}>
                  <div>From: <strong>{item.fromFacility?.name || item.fromFacilityId}</strong></div>
                  <div>To: <strong>{item.toFacility?.name || item.toFacilityId}</strong></div>
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
              key: 'status',
              header: 'Status',
              render: (item) => (
                <StatusBadge
                  label={item.status}
                  status={item.status === 'APPROVED' ? 'confirmed' : item.status === 'REJECTED' ? 'rejected' : item.status === 'TIMED_OUT' ? 'timedOut' : 'pending'}
                />
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (item) =>
                item.status === 'PENDING_DOCTOR_APPROVAL' ? (
                  <div style={{ display: 'flex', gap: Spacing.xs }}>
                    <Button title="Accept" size="sm" onPress={() => handleAction(item.id, 'APPROVED')} />
                    <Button title="Reject" size="sm" variant="danger" onPress={() => handleAction(item.id, 'REJECTED')} />
                  </div>
                ) : (
                  <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>Reviewed</span>
                ),
            },
          ]}
        />
      )}
    </div>
  );
};

export default ReferralManagementScreen;
