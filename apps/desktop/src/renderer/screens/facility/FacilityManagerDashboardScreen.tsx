// Facility Manager Dashboard — Operations, Occupancy, Equipment & Inventory
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { FacilityBedSummary, Equipment, MedicineStock } from '../../types';
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

export const FacilityManagerDashboardScreen: React.FC<{ facilityId?: string }> = ({
  facilityId = 'fac-phc-01',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bedCategories, setBedCategories] = useState<FacilityBedSummary[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [lowStockItems, setLowStockItems] = useState<MedicineStock[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date().toISOString());

  const fetchFacilityData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bedsRes, equipRes, invRes] = await Promise.all([
        api.get<{ categories: FacilityBedSummary[]; lastUpdatedAt: string }>(`/facilities/${facilityId}/beds`).catch(() => ({ categories: [], lastUpdatedAt: new Date().toISOString() })),
        api.get<{ equipment: Equipment[] }>(`/facilities/${facilityId}/equipment`).catch(() => ({ equipment: [] })),
        api.get<{ items: MedicineStock[] }>(`/facilities/${facilityId}/inventory`, { params: { lowStockOnly: true } }).catch(() => ({ items: [] })),
      ]);

      setBedCategories(bedsRes.categories || []);
      setEquipmentList(equipRes.equipment || []);
      setLowStockItems(invRes.items || []);
      setLastUpdatedAt(bedsRes.lastUpdatedAt || new Date().toISOString());
    } catch (err: any) {
      setError(err?.message || 'Failed to load facility operations data');
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    fetchFacilityData();
  }, [fetchFacilityData]);

  const totalBeds = bedCategories.reduce((s, b) => s + b.total, 0);
  const availableBeds = bedCategories.reduce((s, b) => s + b.available, 0);
  const operationalEquip = equipmentList.filter((e) => e.status === 'OPERATIONAL').length;

  return (
    <div data-testid="facility-dashboard-screen" style={{ padding: Spacing.xl, overflowY: 'auto' }}>
      <StaleDataBanner lastUpdatedAt={lastUpdatedAt} />

      {/* KPI Stats Row */}
      <div style={{ display: 'flex', gap: Spacing.md, marginBottom: Spacing.xl }}>
        <StatsCard
          title="Bed Occupancy"
          value={`${totalBeds - availableBeds} / ${totalBeds}`}
          subtext={`${availableBeds} beds available`}
          icon="🛏️"
          testID="kpi-facility-beds"
        />
        <StatsCard
          title="Operational Equipment"
          value={`${operationalEquip} / ${equipmentList.length}`}
          subtext="Devices functional"
          icon="⚙️"
          badge={operationalEquip === equipmentList.length ? '100% OK' : 'Maintenance Needed'}
          badgeColor={operationalEquip === equipmentList.length ? Colors.status.available.bg : Colors.status.lowStock.bg}
          testID="kpi-facility-equipment"
        />
        <StatsCard
          title="Low Stock Alerts"
          value={lowStockItems.length}
          subtext="Medicines below reorder level"
          icon="💊"
          badge={lowStockItems.length > 0 ? 'Reorder Urgent' : 'Stocked'}
          badgeColor={lowStockItems.length > 0 ? Colors.status.outOfStock.bg : Colors.status.available.bg}
          testID="kpi-facility-inventory"
        />
      </div>

      {loading && <LoadingState message="Loading facility operations telemetry..." />}
      {error && !loading && <ErrorState message={error} onRetry={fetchFacilityData} />}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.xl }}>
          {/* Bed Category Status */}
          <div>
            <h3 style={{ margin: `0 0 ${Spacing.md}px`, fontSize: Typography.fontSizes.lg, color: Colors.textPrimary }}>
              🛏️ Ward Bed Availability
            </h3>
            {bedCategories.length === 0 ? (
              <EmptyState title="No Bed Roster" description="Facility has no wards registered." />
            ) : (
              <DataTable
                keyExtractor={(item) => item.category}
                data={bedCategories}
                testID="facility-beds-table"
                columns={[
                  { key: 'category', header: 'Ward Category' },
                  { key: 'total', header: 'Total Beds' },
                  { key: 'available', header: 'Available' },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (item) => (
                      <StatusBadge
                        label={item.available > 0 ? `${item.available} Free` : 'Full'}
                        status={item.available > 0 ? 'available' : 'outOfStock'}
                      />
                    ),
                  },
                ]}
              />
            )}
          </div>

          {/* Critical Inventory Stock Alerts */}
          <div>
            <h3 style={{ margin: `0 0 ${Spacing.md}px`, fontSize: Typography.fontSizes.lg, color: Colors.textPrimary }}>
              💊 Critical Stock Warnings
            </h3>
            {lowStockItems.length === 0 ? (
              <EmptyState title="Stock Health Normal" description="No medicines are currently running low." />
            ) : (
              <DataTable
                keyExtractor={(item) => item.id}
                data={lowStockItems}
                testID="facility-lowstock-table"
                columns={[
                  {
                    key: 'medicine',
                    header: 'Medicine Name',
                    render: (item) => item.medicine?.name || item.medicineId,
                  },
                  {
                    key: 'currentStock',
                    header: 'Current Stock',
                    render: (item) => `${item.currentStock} ${item.unit}`,
                  },
                  {
                    key: 'reorder',
                    header: 'Reorder Level',
                    render: (item) => `${item.reorderLevel} ${item.unit}`,
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (item) => (
                      <StatusBadge
                        label={item.currentStock === 0 ? 'Out of Stock' : 'Low Stock'}
                        status={item.currentStock === 0 ? 'outOfStock' : 'lowStock'}
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

export default FacilityManagerDashboardScreen;
