// Desktop Bed Management Screen — Ward allocations and live bed statuses
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { Bed, BedStatus, PaginatedResult } from '../../types';
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

const BED_STATUSES: BedStatus[] = [
  'AVAILABLE',
  'OCCUPIED',
  'RESERVED',
  'MAINTENANCE',
  'UNAVAILABLE',
];

export const BedManagementScreen: React.FC<{ facilityId?: string }> = ({
  facilityId = 'fac-phc-01',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date().toISOString());
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchBeds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PaginatedResult<Bed>>('/beds', {
        params: { facilityId, limit: 100 },
      });
      setBeds(res.data || []);
      setLastUpdatedAt(new Date().toISOString());
    } catch (err: any) {
      setError(err?.message || 'Failed to load beds roster');
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    fetchBeds();
  }, [fetchBeds]);

  const handleStatusChange = async (bedId: string, newStatus: BedStatus) => {
    try {
      const updated = await api.patch<Bed>(`/beds/${bedId}`, { status: newStatus });
      setBeds((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to update bed');
    }
  };

  const filteredBeds = beds.filter((b) => {
    if (filterStatus === 'ALL') return true;
    return b.status === filterStatus;
  });

  return (
    <div data-testid="bed-management-screen" style={{ padding: Spacing.xl, overflowY: 'auto' }}>
      <StaleDataBanner lastUpdatedAt={lastUpdatedAt} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
        <div>
          <h2 style={{ margin: 0, fontSize: Typography.fontSizes.xl, color: Colors.textPrimary }}>
            🛏️ Facility Bed Management
          </h2>
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
            Instant bed allocation, maintenance flagging, and occupancy status
          </span>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: Spacing.xs }}>
          {['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              data-testid={`bed-filter-${st}`}
              style={{
                padding: `${Spacing.xs}px ${Spacing.md}px`,
                borderRadius: Spacing.borderRadius.full,
                border: `1px solid ${filterStatus === st ? Colors.primary : Colors.border}`,
                backgroundColor: filterStatus === st ? Colors.primary : Colors.surface,
                color: filterStatus === st ? '#FFF' : Colors.textSecondary,
                fontSize: Typography.fontSizes.xs,
                cursor: 'pointer',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading && <LoadingState message="Loading bed layout..." />}
      {error && !loading && <ErrorState message={error} onRetry={fetchBeds} />}

      {!loading && !error && filteredBeds.length === 0 && (
        <EmptyState title="No Beds Found" description="No beds match your filter criteria." />
      )}

      {!loading && !error && filteredBeds.length > 0 && (
        <DataTable
          keyExtractor={(item) => item.id}
          data={filteredBeds}
          testID="bed-roster-table"
          columns={[
            {
              key: 'bedNumber',
              header: 'Bed #',
              render: (item) => <strong>Bed {item.bedNumber}</strong>,
            },
            { key: 'ward', header: 'Ward Name' },
            { key: 'category', header: 'Category' },
            {
              key: 'status',
              header: 'Current Status',
              render: (item) => (
                <StatusBadge
                  label={item.status}
                  status={item.status === 'AVAILABLE' ? 'available' : item.status === 'OCCUPIED' ? 'confirmed' : 'lowStock'}
                />
              ),
            },
            {
              key: 'actions',
              header: 'Quick Update',
              render: (item) => (
                <select
                  value={item.status}
                  onChange={(e) => handleStatusChange(item.id, e.target.value as BedStatus)}
                  data-testid={`bed-status-select-${item.id}`}
                  style={{
                    padding: `${Spacing.xs}px ${Spacing.sm}px`,
                    borderRadius: Spacing.borderRadius.sm,
                    border: `1px solid ${Colors.border}`,
                    fontSize: Typography.fontSizes.xs,
                    backgroundColor: Colors.surface,
                  }}
                >
                  {BED_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              ),
            },
          ]}
        />
      )}
    </div>
  );
};

export default BedManagementScreen;
