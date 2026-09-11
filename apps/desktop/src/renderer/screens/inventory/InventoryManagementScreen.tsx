// Desktop Medicine Inventory Management Screen
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { MedicineStock } from '../../types';
import { Colors, Spacing, Typography } from '../../theme';
import {
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  StaleDataBanner,
  StatusBadge,
  TextInput,
} from '../../components';

export const InventoryManagementScreen: React.FC<{ facilityId?: string }> = ({
  facilityId = 'fac-phc-01',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<MedicineStock[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date().toISOString());
  const [search, setSearch] = useState('');

  // Intake Form
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [intakeMedId, setIntakeMedId] = useState('');
  const [intakeQty, setIntakeQty] = useState(100);
  const [intakeBatch, setIntakeBatch] = useState('');
  const [intakeExpiry, setIntakeExpiry] = useState('');
  const [intakeSupplier, setIntakeSupplier] = useState('');
  const [intakeSubmitting, setIntakeSubmitting] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ items: MedicineStock[]; lastUpdatedAt: string }>(
        `/facilities/${facilityId}/inventory`,
        { params: { search: search || undefined, limit: 100 } },
      );
      setItems(res.items || []);
      setLastUpdatedAt(res.lastUpdatedAt || new Date().toISOString());
    } catch (err: any) {
      setError(err?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [facilityId, search]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleRecordIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intakeMedId || intakeQty <= 0) return;
    setIntakeSubmitting(true);
    try {
      await api.post('/inventory/intake', {
        facilityId,
        medicineId: intakeMedId,
        quantity: intakeQty,
        batchNumber: intakeBatch || undefined,
        expiryDate: intakeExpiry || undefined,
        supplier: intakeSupplier || undefined,
      });
      setShowIntakeModal(false);
      setIntakeMedId('');
      setIntakeBatch('');
      fetchInventory();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Intake failed');
    } finally {
      setIntakeSubmitting(false);
    }
  };

  return (
    <div data-testid="inventory-management-screen" style={{ padding: Spacing.xl, overflowY: 'auto' }}>
      <StaleDataBanner lastUpdatedAt={lastUpdatedAt} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
        <div>
          <h2 style={{ margin: 0, fontSize: Typography.fontSizes.xl, color: Colors.textPrimary }}>
            💊 Pharmacy & Medicine Inventory
          </h2>
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
            Facility stock balance, batch numbers, shelf expiration, and stock intake
          </span>
        </div>

        <div style={{ display: 'flex', gap: Spacing.sm }}>
          <Button
            title="+ Stock Intake / Receipt"
            variant="primary"
            onPress={() => setShowIntakeModal(true)}
            testID="intake-btn"
          />
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: Spacing.md, maxWidth: 400 }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by medicine or generic name..."
        />
      </div>

      {loading && <LoadingState message="Loading inventory records..." />}
      {error && !loading && <ErrorState message={error} onRetry={fetchInventory} />}

      {!loading && !error && items.length === 0 && (
        <EmptyState title="No Medicine Stock Logged" description="No inventory items match your search." />
      )}

      {!loading && !error && items.length > 0 && (
        <DataTable
          keyExtractor={(item) => item.id}
          data={items}
          testID="inventory-table"
          columns={[
            {
              key: 'medicine',
              header: 'Medicine',
              render: (item) => (
                <div>
                  <strong>{item.medicine?.name || item.medicineId}</strong>
                  <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>
                    Generic: {item.medicine?.genericName || 'N/A'} ({item.medicine?.strength || ''})
                  </div>
                </div>
              ),
            },
            {
              key: 'stock',
              header: 'Stock Level',
              render: (item) => (
                <span style={{ fontWeight: Typography.fontWeights.bold, fontSize: Typography.fontSizes.md, color: Colors.primary }}>
                  {item.currentStock} {item.unit}
                </span>
              ),
            },
            {
              key: 'reorder',
              header: 'Reorder Level',
              render: (item) => `${item.reorderLevel} ${item.unit}`,
            },
            {
              key: 'batch',
              header: 'Batch / Expiry',
              render: (item) => (
                <div>
                  <div>{item.batchNumber ? `Batch: ${item.batchNumber}` : 'No Batch'}</div>
                  {item.expiryDate && (
                    <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>
                      Exp: {item.expiryDate}
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Stock Status',
              render: (item) => (
                <StatusBadge
                  label={item.currentStock === 0 ? 'OUT OF STOCK' : item.currentStock <= item.reorderLevel ? 'LOW STOCK' : 'IN STOCK'}
                  status={item.currentStock === 0 ? 'outOfStock' : item.currentStock <= item.reorderLevel ? 'lowStock' : 'available'}
                />
              ),
            },
          ]}
        />
      )}

      {/* Intake Modal */}
      {showIntakeModal && (
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
          <form
            onSubmit={handleRecordIntake}
            style={{
              backgroundColor: Colors.surface,
              borderRadius: Spacing.borderRadius.lg,
              padding: Spacing.xl,
              width: 480,
              display: 'flex',
              flexDirection: 'column',
              gap: Spacing.md,
            }}
          >
            <h3 style={{ margin: 0, fontSize: Typography.fontSizes.lg, color: Colors.textPrimary }}>
              Record Stock Intake / Receipt
            </h3>

            <TextInput
              label="Medicine ID / Code"
              value={intakeMedId}
              onChangeText={setIntakeMedId}
              placeholder="e.g. med-paracetamol-500"
            />

            <TextInput
              label="Quantity"
              value={String(intakeQty)}
              onChangeText={(t) => setIntakeQty(Number(t))}
              type="number"
            />

            <TextInput
              label="Batch Number"
              value={intakeBatch}
              onChangeText={setIntakeBatch}
              placeholder="e.g. BATCH-2026-A"
            />

            <TextInput
              label="Expiry Date"
              value={intakeExpiry}
              onChangeText={setIntakeExpiry}
              type="date"
            />

            <TextInput
              label="Supplier / Source"
              value={intakeSupplier}
              onChangeText={setIntakeSupplier}
              placeholder="e.g. District Central Medical Store"
            />

            <div style={{ display: 'flex', gap: Spacing.sm, justifyContent: 'flex-end', marginTop: Spacing.sm }}>
              <Button title="Cancel" variant="outline" onPress={() => setShowIntakeModal(false)} />
              <Button title="Save Intake" onPress={() => handleRecordIntake({ preventDefault: () => {} } as any)} isLoading={intakeSubmitting} />
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default InventoryManagementScreen;
