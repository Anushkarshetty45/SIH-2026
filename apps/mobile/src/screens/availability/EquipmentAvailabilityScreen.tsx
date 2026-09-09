// Equipment Availability Screen — Real-time Facility Equipment Status & Freshness
import React, { useState, useEffect, useCallback } from 'react';
import { equipmentService } from '../../services/equipment.service';
import { Equipment } from '../../types';
import { Colors, Spacing, Typography } from '../../theme';
import {
  Button,
  EmptyState,
  EquipmentCard,
  ErrorState,
  LoadingState,
  StaleDataWarning,
} from '../../components';

export interface EquipmentAvailabilityScreenProps {
  facilityId: string;
  facilityName?: string;
  onSelectEquipment?: (equipment: Equipment) => void;
  onNavigateBack?: () => void;
}

export const EquipmentAvailabilityScreen: React.FC<EquipmentAvailabilityScreenProps> = ({
  facilityId,
  facilityName = 'Healthcare Facility',
  onSelectEquipment,
  onNavigateBack,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date().toISOString());
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await equipmentService.getFacilityEquipment(facilityId);
      setEquipmentList(data.equipment || []);
      setLastUpdatedAt(data.lastUpdatedAt || new Date().toISOString());
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load equipment list');
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const filteredEquipment = equipmentList.filter((item) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'OPERATIONAL') return item.status === 'OPERATIONAL';
    if (selectedFilter === 'AVAILABLE_ONLY') return item.availableQuantity > 0;
    if (selectedFilter === 'MAINTENANCE')
      return item.status === 'UNDER_MAINTENANCE' || item.status === 'DEFECTIVE';
    return item.category.toUpperCase() === selectedFilter;
  });

  const totalAvailable = equipmentList.reduce((sum, item) => sum + item.availableQuantity, 0);
  const totalEquip = equipmentList.reduce((sum, item) => sum + item.totalQuantity, 0);

  return (
    <div
      data-testid="equipment-availability-screen"
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
            Equipment Availability
          </h2>
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
            {facilityName}
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

      {/* Freshness Banner */}
      <div
        style={{
          padding: `${Spacing.sm}px ${Spacing.lg}px`,
          backgroundColor: Colors.surfaceSubtle,
          borderBottom: `1px solid ${Colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <StaleDataWarning
          lastUpdatedAt={lastUpdatedAt}
          resourceName="equipment"
          testID="freshness-indicator"
        />
        {!loading && (
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>
            {totalAvailable} of {totalEquip} units operational
          </span>
        )}
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
        {['ALL', 'AVAILABLE_ONLY', 'OPERATIONAL', 'MAINTENANCE'].map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            data-testid={`filter-${filter}`}
            style={{
              padding: `${Spacing.xs}px ${Spacing.sm}px`,
              borderRadius: Spacing.borderRadius.full,
              border: `1px solid ${selectedFilter === filter ? Colors.primary : Colors.border}`,
              backgroundColor: selectedFilter === filter ? Colors.primary : Colors.surface,
              color: selectedFilter === filter ? Colors.textInverse : Colors.textSecondary,
              fontSize: Typography.fontSizes.xs,
              fontWeight: Typography.fontWeights.medium,
              cursor: 'pointer',
            }}
          >
            {filter.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: Spacing.lg, overflowY: 'auto' }}>
        {loading && <LoadingState message="Loading equipment status..." />}

        {error && !loading && (
          <ErrorState
            title="Unable to Load Equipment"
            message={error}
            onRetry={fetchEquipment}
          />
        )}

        {!loading && !error && filteredEquipment.length === 0 && (
          <EmptyState
            title="No Equipment Found"
            description="No medical equipment matched your current filter criteria."
            actionLabel="Reset Filter"
            onAction={() => setSelectedFilter('ALL')}
          />
        )}

        {!loading && !error && filteredEquipment.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: Spacing.sm }}>
            {filteredEquipment.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectEquipment && onSelectEquipment(item)}
                style={{ cursor: onSelectEquipment ? 'pointer' : 'default' }}
              >
                <EquipmentCard
                  equipment={item}
                  testID={`equipment-card-${item.id}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentAvailabilityScreen;
