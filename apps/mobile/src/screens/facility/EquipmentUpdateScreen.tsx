// Equipment Update Screen — Facility Equipment Quantities and Operational Status
import React, { useState, useEffect, useCallback } from 'react';
import { equipmentService } from '../../services/equipment.service';
import { Equipment, EquipmentStatus } from '../../types';
import { Colors, Spacing, Typography } from '../../theme';
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  StaleDataWarning,
  StatusBadge,
} from '../../components';

export interface EquipmentUpdateScreenProps {
  facilityId: string;
  facilityName?: string;
  onNavigateBack?: () => void;
}

const EQUIPMENT_STATUSES: EquipmentStatus[] = [
  'OPERATIONAL',
  'UNDER_MAINTENANCE',
  'DEFECTIVE',
  'UNAVAILABLE',
];

export const EquipmentUpdateScreen: React.FC<EquipmentUpdateScreenProps> = ({
  facilityId,
  facilityName = 'Healthcare Facility',
  onNavigateBack,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date().toISOString());
  const [selectedEquip, setSelectedEquip] = useState<Equipment | null>(null);
  const [editAvailableQty, setEditAvailableQty] = useState<number>(0);
  const [editTotalQty, setEditTotalQty] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<EquipmentStatus>('OPERATIONAL');
  const [updating, setUpdating] = useState(false);

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await equipmentService.getFacilityEquipment(facilityId);
      setEquipmentList(data.equipment || []);
      setLastUpdatedAt(data.lastUpdatedAt || new Date().toISOString());
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load equipment');
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const handleOpenEdit = (item: Equipment) => {
    setSelectedEquip(item);
    setEditAvailableQty(item.availableQuantity);
    setEditTotalQty(item.totalQuantity);
    setEditStatus(item.status);
  };

  const handleSaveUpdate = async () => {
    if (!selectedEquip) return;
    setUpdating(true);
    try {
      const updated = await equipmentService.updateEquipment(selectedEquip.id, {
        availableQuantity: editAvailableQty,
        totalQuantity: editTotalQty,
        status: editStatus,
      });
      setEquipmentList((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setSelectedEquip(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update equipment');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      data-testid="equipment-update-screen"
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
            Manage Equipment & Devices
          </h2>
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
            {facilityName} • Update functional counts and maintenance statuses
          </span>
        </div>

        <Button
          title="Refresh"
          variant="outline"
          onPress={fetchEquipment}
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
        <StaleDataWarning lastUpdatedAt={lastUpdatedAt} resourceName="equipment records" />
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: Spacing.lg, overflowY: 'auto' }}>
        {loading && <LoadingState message="Loading facility equipment list..." />}

        {error && !loading && (
          <ErrorState title="Equipment Update Error" message={error} onRetry={fetchEquipment} />
        )}

        {!loading && !error && equipmentList.length === 0 && (
          <EmptyState
            title="No Equipment Registered"
            description="No medical equipment records found for this facility."
          />
        )}

        {!loading && !error && equipmentList.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: Spacing.sm }}>
            {equipmentList.map((item) => (
              <div
                key={item.id}
                data-testid={`equipment-row-${item.id}`}
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
                  <div style={{ fontWeight: Typography.fontWeights.bold, fontSize: Typography.fontSizes.md, color: Colors.textPrimary }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
                    Category: {item.category} • Available: {item.availableQuantity} / {item.totalQuantity}
                  </div>
                  <div style={{ marginTop: Spacing.xs }}>
                    <StatusBadge
                      label={item.status}
                      variant={item.status === 'OPERATIONAL' ? 'available' : 'lowStock'}
                    />
                  </div>
                </div>

                <Button
                  title="Edit Status / Qty"
                  variant="outline"
                  onPress={() => handleOpenEdit(item)}
                  testID={`edit-equip-${item.id}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal Dialog */}
      {selectedEquip && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: Colors.surface,
              borderRadius: Spacing.borderRadius.lg,
              padding: Spacing.lg,
              width: '90%',
              maxWidth: 400,
            }}
          >
            <h3 style={{ margin: `0 0 ${Spacing.md}px`, fontSize: Typography.fontSizes.md, color: Colors.textPrimary }}>
              Update {selectedEquip.name}
            </h3>

            <div style={{ marginBottom: Spacing.sm }}>
              <label style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>Operational Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as EquipmentStatus)}
                style={{
                  width: '100%',
                  padding: Spacing.xs,
                  marginTop: 4,
                  borderRadius: Spacing.borderRadius.sm,
                  border: `1px solid ${Colors.border}`,
                }}
              >
                {EQUIPMENT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.md }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>Available Units</label>
                <input
                  type="number"
                  value={editAvailableQty}
                  onChange={(e) => setEditAvailableQty(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: Spacing.xs,
                    marginTop: 4,
                    borderRadius: Spacing.borderRadius.sm,
                    border: `1px solid ${Colors.border}`,
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>Total Units</label>
                <input
                  type="number"
                  value={editTotalQty}
                  onChange={(e) => setEditTotalQty(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: Spacing.xs,
                    marginTop: 4,
                    borderRadius: Spacing.borderRadius.sm,
                    border: `1px solid ${Colors.border}`,
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: Spacing.sm, justifyContent: 'flex-end' }}>
              <Button title="Cancel" variant="outline" onPress={() => setSelectedEquip(null)} />
              <Button title="Save Changes" onPress={handleSaveUpdate} isLoading={updating} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentUpdateScreen;
