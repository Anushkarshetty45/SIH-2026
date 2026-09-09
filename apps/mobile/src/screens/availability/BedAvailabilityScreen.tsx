// Bed Availability Screen — Real-time Bed Counts with Freshness & Stale Data Warnings
import React, { useState, useEffect, useCallback } from 'react';
import { bedService, EmergencyBedAvailability } from '../../services/bed.service';
import { BedCategory, FacilityBedSummary } from '../../types';
import { Colors, Spacing, Typography } from '../../theme';
import {
  BedAvailabilityCard,
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  StaleDataWarning,
  StatusBadge,
} from '../../components';

export interface BedAvailabilityScreenProps {
  facilityId: string;
  facilityName?: string;
  onSelectCategory?: (category: BedCategory) => void;
  onNavigateBack?: () => void;
}

export const BedAvailabilityScreen: React.FC<BedAvailabilityScreenProps> = ({
  facilityId,
  facilityName = 'Healthcare Facility',
  onSelectCategory,
  onNavigateBack,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<FacilityBedSummary[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date().toISOString());
  const [isStale, setIsStale] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [emergencyMode, setEmergencyMode] = useState<boolean>(false);
  const [emergencyBeds, setEmergencyBeds] = useState<EmergencyBedAvailability[]>([]);

  const fetchBedData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (emergencyMode) {
        const emergencyData = await bedService.getEmergencyBedAvailability(facilityId);
        setEmergencyBeds(emergencyData);
        if (emergencyData.length > 0) {
          setLastUpdatedAt(emergencyData[0].lastUpdatedAt);
          setIsStale(emergencyData[0].isStale);
        }
      } else {
        const data = await bedService.getFacilityBedSummary(facilityId);
        setCategories(data.categories || []);
        setLastUpdatedAt(data.lastUpdatedAt || new Date().toISOString());
        setIsStale(data.isStale || false);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load bed availability');
    } finally {
      setLoading(false);
    }
  }, [facilityId, emergencyMode]);

  useEffect(() => {
    fetchBedData();
  }, [fetchBedData]);

  const filteredCategories = categories.filter((c) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'AVAILABLE_ONLY') return c.available > 0;
    return c.category === selectedFilter;
  });

  const totalBeds = categories.reduce((sum, c) => sum + c.total, 0);
  const totalAvailable = categories.reduce((sum, c) => sum + c.available, 0);

  return (
    <div
      data-testid="bed-availability-screen"
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
            Bed Availability
          </h2>
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
            {facilityName}
          </span>
        </div>

        <div style={{ display: 'flex', gap: Spacing.sm }}>
          <Button
            title={emergencyMode ? 'Standard Mode' : '🚨 Emergency View'}
            variant={emergencyMode ? 'secondary' : 'primary'}
            onPress={() => setEmergencyMode(!emergencyMode)}
            testID="emergency-mode-toggle"
          />
          <Button
            title="Refresh"
            variant="outline"
            onPress={fetchBedData}
            isLoading={loading}
            testID="refresh-button"
          />
        </div>
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
          resourceName="bed counts"
          isEmergencyMode={emergencyMode}
          testID="freshness-indicator"
        />
        {!loading && !emergencyMode && (
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>
            {totalAvailable} of {totalBeds} beds available
          </span>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: Spacing.lg, overflowY: 'auto' }}>
        {loading && <LoadingState message="Loading live bed availability..." />}

        {error && !loading && (
          <ErrorState
            title="Unable to Load Bed Availability"
            message={error}
            onRetry={fetchBedData}
          />
        )}

        {!loading && !error && emergencyMode && (
          <div>
            <div
              style={{
                backgroundColor: Colors.freshness.stale.bg,
                border: `1px solid ${Colors.freshness.stale.border}`,
                borderRadius: Spacing.borderRadius.md,
                padding: Spacing.md,
                marginBottom: Spacing.md,
              }}
            >
              <h4 style={{ margin: 0, color: Colors.freshness.stale.text, fontSize: Typography.fontSizes.sm }}>
                Emergency Bed Availability (ICU / Oxygen / Ventilator)
              </h4>
              <p style={{ margin: `${Spacing.xs}px 0 0`, fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
                Rule 11: Emergency data older than 2 hours requires verbal re-confirmation prior to transfer.
              </p>
            </div>

            {emergencyBeds.map((facility) => (
              <div
                key={facility.facilityId}
                style={{
                  backgroundColor: Colors.surface,
                  border: `1px solid ${Colors.border}`,
                  borderRadius: Spacing.borderRadius.lg,
                  padding: Spacing.md,
                  marginBottom: Spacing.md,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: Typography.fontSizes.md, color: Colors.textPrimary }}>
                    {facility.facilityName}
                  </h3>
                  {facility.unreliableForEmergency && (
                    <StatusBadge label="VERIFY FIRST" variant="timedOut" />
                  )}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: Spacing.sm,
                    marginTop: Spacing.md,
                  }}
                >
                  <div style={{ backgroundColor: Colors.surfaceSubtle, padding: Spacing.sm, borderRadius: Spacing.borderRadius.sm }}>
                    <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>ICU</span>
                    <div style={{ fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: Colors.primary }}>
                      {facility.icuAvailable} / {facility.icuTotal}
                    </div>
                  </div>
                  <div style={{ backgroundColor: Colors.surfaceSubtle, padding: Spacing.sm, borderRadius: Spacing.borderRadius.sm }}>
                    <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>Oxygen</span>
                    <div style={{ fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: Colors.primary }}>
                      {facility.oxygenAvailable} / {facility.oxygenTotal}
                    </div>
                  </div>
                  <div style={{ backgroundColor: Colors.surfaceSubtle, padding: Spacing.sm, borderRadius: Spacing.borderRadius.sm }}>
                    <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>Ventilator</span>
                    <div style={{ fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: Colors.primary }}>
                      {facility.ventilatorAvailable} / {facility.ventilatorTotal}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: Spacing.sm }}>
                  <StaleDataWarning
                    lastUpdatedAt={facility.lastUpdatedAt}
                    isEmergencyMode={true}
                    resourceName="emergency beds"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && !emergencyMode && (
          <div>
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: Spacing.xs, marginBottom: Spacing.md, overflowX: 'auto' }}>
              {['ALL', 'AVAILABLE_ONLY', 'GENERAL', 'ICU', 'OXYGEN', 'VENTILATOR', 'MATERNITY', 'PEDIATRIC'].map(
                (filter) => (
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
                ),
              )}
            </div>

            {filteredCategories.length === 0 ? (
              <EmptyState
                title="No Bed Records Found"
                description="No beds matched your selected category filter."
                actionLabel="Show All"
                onAction={() => setSelectedFilter('ALL')}
              />
            ) : (
              filteredCategories.map((item) => (
                <div
                  key={item.category}
                  onClick={() => onSelectCategory && onSelectCategory(item.category)}
                  style={{ cursor: onSelectCategory ? 'pointer' : 'default' }}
                >
                  <BedAvailabilityCard
                    category={item.category}
                    availableCount={item.available}
                    totalCount={item.total}
                    lastUpdatedAt={lastUpdatedAt}
                    facilityName={facilityName}
                    testID={`bed-card-${item.category}`}
                  />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BedAvailabilityScreen;
