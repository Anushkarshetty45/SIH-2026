// Bed Update Screen — Facility Staff / Admin Bed Status Management
import React, { useState, useEffect, useCallback } from 'react';
import { bedService } from '../../services/bed.service';
import { Bed, BedStatus } from '../../types';
import { Colors, Spacing, Typography } from '../../theme';
import {
  Button,
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  StaleDataWarning,
  StatusBadge,
} from '../../components';

export interface BedUpdateScreenProps {
  facilityId: string;
  facilityName?: string;
  onNavigateBack?: () => void;
}

const BED_STATUSES: BedStatus[] = [
  'AVAILABLE',
  'OCCUPIED',
  'RESERVED',
  'MAINTENANCE',
  'UNAVAILABLE',
];

export const BedUpdateScreen: React.FC<BedUpdateScreenProps> = ({
  facilityId,
  facilityName = 'Healthcare Facility',
  onNavigateBack,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date().toISOString());
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [targetStatus, setTargetStatus] = useState<BedStatus | null>(null);
  const [updating, setUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchBeds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bedService.listBeds({ facilityId, limit: 100 });
      setBeds(response.data || []);
      setLastUpdatedAt(new Date().toISOString());
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load facility beds');
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    fetchBeds();
  }, [fetchBeds]);

  const handleStatusChangeRequest = (bed: Bed, newStatus: BedStatus) => {
    setSelectedBed(bed);
    setTargetStatus(newStatus);
  };

  const confirmStatusUpdate = async () => {
    if (!selectedBed || !targetStatus) return;
    setUpdating(true);
    try {
      const updated = await bedService.updateBedStatus(selectedBed.id, {
        status: targetStatus,
      });
      setBeds((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      setSelectedBed(null);
      setTargetStatus(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update bed status');
    } finally {
      setUpdating(false);
    }
  };

  const filteredBeds = beds.filter((b) => {
    if (statusFilter === 'ALL') return true;
    return b.status === statusFilter;
  });

  return (
    <div
      data-testid="bed-update-screen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: Colors.background,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: `${Spacing.md}px ${Spacing.lg}px`,
          backgroundColor: Colors.surface,
          borderBottom: `1px solid ${Colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          {onNavigateBack && (
            <button
              onClick={onNavigateBack}
              data-testid="back-button"
              style={{
                background: 'none',
                border: 'none',
                color: Colors.primary,
                cursor: 'pointer',
                fontSize: Typography.fontSizes.sm,
                fontWeight: Typography.fontWeights.medium,
                padding: 0,
                marginBottom: Spacing.xs,
              }}
            >
              ← Back
            </button>
          )}
          <h2
            style={{
              margin: 0,
              fontSize: Typography.fontSizes.lg,
              fontWeight: Typography.fontWeights.bold,
              color: Colors.textPrimary,
            }}
          >
            Manage Facility Beds
          </h2>
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
            {facilityName} • Update live occupancy and ward allocations
          </span>
        </div>

        <Button
          title="Refresh"
          variant="outline"
          onPress={fetchBeds}
          isLoading={loading}
          testID="refresh-button"
        />
      </div>

      {/* Freshness Bar */}
      <div
        style={{
          padding: `${Spacing.sm}px ${Spacing.lg}px`,
          backgroundColor: Colors.surfaceSubtle,
          borderBottom: `1px solid ${Colors.border}`,
        }}
      >
        <StaleDataWarning lastUpdatedAt={lastUpdatedAt} resourceName="bed status" />
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          padding: `${Spacing.sm}px ${Spacing.lg}px`,
          display: 'flex',
          gap: Spacing.xs,
          overflowX: 'auto',
          backgroundColor: Colors.surface,
          borderBottom: `1px solid ${Colors.border}`,
        }}
      >
        {['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'].map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            data-testid={`filter-${filter}`}
            style={{
              padding: `${Spacing.xs}px ${Spacing.sm}px`,
              borderRadius: Spacing.borderRadius.full,
              border: `1px solid ${statusFilter === filter ? Colors.primary : Colors.border}`,
              backgroundColor: statusFilter === filter ? Colors.primary : Colors.surface,
              color: statusFilter === filter ? Colors.textInverse : Colors.textSecondary,
              fontSize: Typography.fontSizes.xs,
              fontWeight: Typography.fontWeights.medium,
              cursor: 'pointer',
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: Spacing.lg, overflowY: 'auto' }}>
        {loading && <LoadingState message="Loading facility bed roster..." />}

        {error && !loading && (
          <ErrorState title="Bed Update Error" message={error} onRetry={fetchBeds} />
        )}

        {!loading && !error && filteredBeds.length === 0 && (
          <EmptyState
            title="No Beds Found"
            description="No beds match your current status filter."
            actionLabel="View All Beds"
            onAction={() => setStatusFilter('ALL')}
          />
        )}

        {!loading && !error && filteredBeds.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: Spacing.sm }}>
            {filteredBeds.map((bed) => (
              <div
                key={bed.id}
                data-testid={`bed-row-${bed.id}`}
                style={{
                  backgroundColor: Colors.surface,
                  border: `1px solid ${Colors.border}`,
                  borderRadius: Spacing.borderRadius.lg,
                  padding: Spacing.md,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
                    <span style={{ fontWeight: Typography.fontWeights.bold, fontSize: Typography.fontSizes.md, color: Colors.textPrimary }}>
                      Bed {bed.bedNumber}
                    </span>
                    <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
                      {bed.ward} ({bed.category})
                    </span>
                  </div>
                  <div style={{ marginTop: Spacing.xs }}>
                    <StatusBadge
                      label={bed.status}
                      variant={bed.status === 'AVAILABLE' ? 'available' : bed.status === 'OCCUPIED' ? 'confirmed' : 'pending'}
                    />
                  </div>
                </div>

                {/* Status Selector */}
                <div style={{ display: 'flex', gap: Spacing.xs, alignItems: 'center' }}>
                  <select
                    value={bed.status}
                    onChange={(e) => handleStatusChangeRequest(bed, e.target.value as BedStatus)}
                    data-testid={`bed-status-select-${bed.id}`}
                    style={{
                      padding: `${Spacing.xs}px ${Spacing.sm}px`,
                      borderRadius: Spacing.borderRadius.sm,
                      border: `1px solid ${Colors.border}`,
                      backgroundColor: Colors.surface,
                      fontSize: Typography.fontSizes.xs,
                      fontWeight: Typography.fontWeights.medium,
                      cursor: 'pointer',
                    }}
                  >
                    {BED_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(selectedBed && targetStatus)}
        title="Confirm Bed Status Update"
        message={`Are you sure you want to change Bed ${selectedBed?.bedNumber} (${selectedBed?.ward}) status from ${selectedBed?.status} to ${targetStatus}?`}
        confirmLabel={updating ? 'Updating...' : 'Confirm Update'}
        onConfirm={confirmStatusUpdate}
        onCancel={() => {
          setSelectedBed(null);
          setTargetStatus(null);
        }}
      />
    </div>
  );
};

export default BedUpdateScreen;
