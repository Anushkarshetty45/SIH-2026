// District Administration Dashboard — Cross-Facility Aggregates & Staleness Monitoring
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { Colors, Spacing, Typography } from '../../theme';
import {
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  StaleDataBanner,
  StatsCard,
  StatusBadge,
} from '../../components';

export const DistrictAdminDashboardScreen: React.FC<{ district?: string }> = ({
  district = 'Pune',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emergencyBeds, setEmergencyBeds] = useState<any[]>([]);
  const [staleFacilities, setStaleFacilities] = useState<any[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date().toISOString());

  const fetchDistrictData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bedsRes, staleRes] = await Promise.all([
        api.get<any[]>('/beds/emergency-availability', { params: { district } }).catch(() => []),
        api.get<any[]>('/beds/stale', { params: { thresholdMinutes: 120 } }).catch(() => []),
      ]);

      setEmergencyBeds(bedsRes || []);
      setStaleFacilities(staleRes || []);
      setLastUpdatedAt(new Date().toISOString());
    } catch (err: any) {
      setError(err?.message || 'Failed to load district metrics');
    } finally {
      setLoading(false);
    }
  }, [district]);

  useEffect(() => {
    fetchDistrictData();
  }, [fetchDistrictData]);

  const totalIcuAvailable = emergencyBeds.reduce((sum, b) => sum + (b.icuAvailable || 0), 0);
  const totalOxygenAvailable = emergencyBeds.reduce((sum, b) => sum + (b.oxygenAvailable || 0), 0);
  const totalVentilatorAvailable = emergencyBeds.reduce((sum, b) => sum + (b.ventilatorAvailable || 0), 0);

  return (
    <div data-testid="district-dashboard-screen" style={{ padding: Spacing.xl, overflowY: 'auto' }}>
      <StaleDataBanner lastUpdatedAt={lastUpdatedAt} />

      {/* KPI Stats Row */}
      <div style={{ display: 'flex', gap: Spacing.md, marginBottom: Spacing.xl }}>
        <StatsCard
          title="District ICU Beds Free"
          value={totalIcuAvailable}
          subtext={`Across ${emergencyBeds.length} facilities in ${district}`}
          icon="🫁"
          badge="Live Aggregate"
          badgeColor={Colors.status.available.bg}
          testID="kpi-district-icu"
        />
        <StatsCard
          title="District Oxygen Beds Free"
          value={totalOxygenAvailable}
          subtext="High-flow oxygen beds"
          icon="💨"
          testID="kpi-district-oxygen"
        />
        <StatsCard
          title="Ventilators Free"
          value={totalVentilatorAvailable}
          subtext="Life-critical inventory"
          icon="⚡"
          testID="kpi-district-ventilator"
        />
        <StatsCard
          title="Stale Facilities Escalations"
          value={staleFacilities.length}
          subtext="Data > 2 hours unverified"
          icon="⚠️"
          badge={staleFacilities.length > 0 ? 'Tier 1 Escalation' : 'All Fresh'}
          badgeColor={staleFacilities.length > 0 ? Colors.status.outOfStock.bg : Colors.status.available.bg}
          testID="kpi-district-stale"
        />
      </div>

      {loading && <LoadingState message="Aggregating district healthcare data..." />}
      {error && !loading && <ErrorState message={error} onRetry={fetchDistrictData} />}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: Spacing.xl }}>
          {/* Facilities Emergency Capacity Table */}
          <div>
            <h3 style={{ margin: `0 0 ${Spacing.md}px`, fontSize: Typography.fontSizes.lg, color: Colors.textPrimary }}>
              🏥 Facilities Emergency Bed Roster ({district} District)
            </h3>
            {emergencyBeds.length === 0 ? (
              <EmptyState title="No Facility Records Found" description="No registered hospitals found for this district." />
            ) : (
              <DataTable
                keyExtractor={(item) => item.facilityId}
                data={emergencyBeds}
                testID="district-emergency-beds-table"
                columns={[
                  {
                    key: 'facility',
                    header: 'Facility Name',
                    render: (item) => (
                      <div>
                        <strong>{item.facilityName}</strong>
                        <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>
                          ID: {item.facilityId}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'icu',
                    header: 'ICU (Free/Total)',
                    render: (item) => `${item.icuAvailable} / ${item.icuTotal}`,
                  },
                  {
                    key: 'oxygen',
                    header: 'Oxygen (Free/Total)',
                    render: (item) => `${item.oxygenAvailable} / ${item.oxygenTotal}`,
                  },
                  {
                    key: 'ventilator',
                    header: 'Ventilator (Free/Total)',
                    render: (item) => `${item.ventilatorAvailable} / ${item.ventilatorTotal}`,
                  },
                  {
                    key: 'freshness',
                    header: 'Data Reliability',
                    render: (item) => (
                      <StatusBadge
                        label={item.unreliableForEmergency ? 'STALE - VERIFY FIRST' : 'LIVE & CURRENT'}
                        status={item.unreliableForEmergency ? 'outOfStock' : 'confirmed'}
                      />
                    ),
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

export default DistrictAdminDashboardScreen;
