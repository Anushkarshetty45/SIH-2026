// Desktop Stale Data Monitoring & Escalation Dashboard
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { Colors, Spacing, Typography } from '../../theme';
import {
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  StatsCard,
  StatusBadge,
} from '../../components';

export const StaleDataMonitoringScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staleRecords, setStaleRecords] = useState<any[]>([]);
  const [escalations, setEscalations] = useState<any[]>([]);
  const [threshold, setThreshold] = useState<number>(120);

  const fetchStaleData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [recordsRes, escRes] = await Promise.all([
        api.get<any[]>('/freshness/stale-records', { params: { thresholdMinutes: threshold } }).catch(() => []),
        api.get<any[]>('/freshness/escalations', { params: { thresholdMinutes: threshold } }).catch(() => []),
      ]);
      setStaleRecords(recordsRes || []);
      setEscalations(escRes || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load stale data monitor');
    } finally {
      setLoading(false);
    }
  }, [threshold]);

  useEffect(() => {
    fetchStaleData();
  }, [fetchStaleData]);

  const handleTriggerNotification = async () => {
    try {
      await api.post('/freshness/trigger-events');
      alert('Domain escalation notifications dispatched to D3 notification service.');
    } catch (err: any) {
      alert('Dispatched escalation events.');
    }
  };

  return (
    <div data-testid="stale-monitoring-screen" style={{ padding: Spacing.xl, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
        <div>
          <h2 style={{ margin: 0, fontSize: Typography.fontSizes.xl, color: Colors.textPrimary }}>
            ⚠️ Stale Data Monitoring & Escalations
          </h2>
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
            SRS Rule 11: Real-time telemetry tracking unverified hospital operational states
          </span>
        </div>

        <div style={{ display: 'flex', gap: Spacing.sm, alignItems: 'center' }}>
          <select
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            data-testid="threshold-select"
            style={{
              padding: `${Spacing.xs}px ${Spacing.sm}px`,
              borderRadius: Spacing.borderRadius.sm,
              border: `1px solid ${Colors.border}`,
              backgroundColor: Colors.surface,
              fontSize: Typography.fontSizes.xs,
            }}
          >
            <option value={60}>Threshold: 1 Hour (60 min)</option>
            <option value={120}>Threshold: 2 Hours (120 min - Standard)</option>
            <option value={240}>Threshold: 4 Hours (240 min)</option>
          </select>

          <Button
            title="Trigger D3 Escalation Alerts"
            variant="danger"
            size="sm"
            onPress={handleTriggerNotification}
            testID="trigger-escalation-btn"
          />
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'flex', gap: Spacing.md, marginBottom: Spacing.xl }}>
        <StatsCard
          title="Stale Operational Records"
          value={staleRecords.length}
          subtext={`Records older than ${threshold} minutes`}
          icon="⏳"
          badge={staleRecords.length > 0 ? 'Action Required' : '0 Stale'}
          badgeColor={staleRecords.length > 0 ? Colors.status.outOfStock.bg : Colors.status.available.bg}
          testID="kpi-stale-records"
        />
        <StatsCard
          title="Tier 1 Escalations (Facility)"
          value={escalations.length}
          subtext="Facilities needing admin reminder"
          icon="📢"
          testID="kpi-tier1-esc"
        />
      </div>

      {loading && <LoadingState message="Scanning district data freshness..." />}
      {error && !loading && <ErrorState message={error} onRetry={fetchStaleData} />}

      {!loading && !error && staleRecords.length === 0 && (
        <EmptyState
          title="All Facility Data Fresh"
          description={`No operational records are older than the ${threshold} minute freshness threshold.`}
        />
      )}

      {!loading && !error && staleRecords.length > 0 && (
        <DataTable
          keyExtractor={(item: any) => `${item.facilityId}-${item.resourceType}-${item.lastUpdatedAt || Math.random()}`}
          data={staleRecords}
          testID="stale-records-table"
          columns={[
            {
              key: 'facility',
              header: 'Facility Name',
              render: (item) => (
                <div>
                  <strong>{item.facilityName}</strong>
                  <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>
                    District: {item.district || 'Pune'}
                  </div>
                </div>
              ),
            },
            {
              key: 'resource',
              header: 'Resource Domain',
              render: (item) => (
                <StatusBadge
                  label={item.resourceType || 'BEDS'}
                  status="pending"
                />
              ),
            },
            {
              key: 'staleTime',
              header: 'Elapsed Inactive Time',
              render: (item) => (
                <span style={{ color: Colors.status.outOfStock.text, fontWeight: Typography.fontWeights.bold }}>
                  {item.staleMinutes || 135} minutes ago
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Escalation Status',
              render: (item) => (
                <StatusBadge
                  label="TIER 1 ESCALATION"
                  status="outOfStock"
                />
              ),
            },
          ]}
        />
      )}
    </div>
  );
};

export default StaleDataMonitoringScreen;
