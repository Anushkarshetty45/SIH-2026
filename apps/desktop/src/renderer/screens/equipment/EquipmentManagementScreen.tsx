// Desktop Equipment Management Screen
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { Equipment, EquipmentStatus } from '../../types';
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

const EQUIPMENT_STATUSES: EquipmentStatus[] = [
  'OPERATIONAL',
  'UNDER_MAINTENANCE',
  'DEFECTIVE',
  'UNAVAILABLE',
];

export const EquipmentManagementScreen: React.FC<{ facilityId?: string }> = ({
  facilityId = 'fac-phc-01',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date().toISOString());

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ equipment: Equipment[]; lastUpdatedAt: string }>(
        `/facilities/${facilityId}/equipment`,
      );
      setEquipmentList(res.equipment || []);
      setLastUpdatedAt(res.lastUpdatedAt || new Date().toISOString());
    } catch (err: any) {
      setError(err?.message || 'Failed to load equipment list');
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const handleStatusChange = async (equipmentId: string, status: EquipmentStatus) => {
    try {
      const updated = await api.patch<Equipment>(`/equipment/${equipmentId}`, { status });
      setEquipmentList((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to update equipment status');
    }
  };

  return (
    <div data-testid="equipment-management-screen" style={{ padding: Spacing.xl, overflowY: 'auto' }}>
      <StaleDataBanner lastUpdatedAt={lastUpdatedAt} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
        <div>
          <h2 style={{ margin: 0, fontSize: Typography.fontSizes.xl, color: Colors.textPrimary }}>
            ⚙️ Medical Equipment & Devices
          </h2>
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
            Device operational health, preventive maintenance, and functional quantities
          </span>
        </div>
      </div>

      {loading && <LoadingState message="Loading equipment inventory..." />}
      {error && !loading && <ErrorState message={error} onRetry={fetchEquipment} />}

      {!loading && !error && equipmentList.length === 0 && (
        <EmptyState title="No Equipment Registered" description="No medical devices logged for this facility." />
      )}

      {!loading && !error && equipmentList.length > 0 && (
        <DataTable
          keyExtractor={(item) => item.id}
          data={equipmentList}
          testID="equipment-table"
          columns={[
            {
              key: 'name',
              header: 'Device Name',
              render: (item) => <strong>{item.name}</strong>,
            },
            { key: 'category', header: 'Category' },
            {
              key: 'quantities',
              header: 'Available / Total',
              render: (item) => `${item.availableQuantity} / ${item.totalQuantity}`,
            },
            {
              key: 'status',
              header: 'Operational Status',
              render: (item) => (
                <StatusBadge
                  label={item.status}
                  status={item.status === 'OPERATIONAL' ? 'available' : item.status === 'UNDER_MAINTENANCE' ? 'lowStock' : 'outOfStock'}
                />
              ),
            },
            {
              key: 'actions',
              header: 'Update Status',
              render: (item) => (
                <select
                  value={item.status}
                  onChange={(e) => handleStatusChange(item.id, e.target.value as EquipmentStatus)}
                  data-testid={`equip-status-select-${item.id}`}
                  style={{
                    padding: `${Spacing.xs}px ${Spacing.sm}px`,
                    borderRadius: Spacing.borderRadius.sm,
                    border: `1px solid ${Colors.border}`,
                    fontSize: Typography.fontSizes.xs,
                    backgroundColor: Colors.surface,
                  }}
                >
                  {EQUIPMENT_STATUSES.map((st) => (
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

export default EquipmentManagementScreen;
