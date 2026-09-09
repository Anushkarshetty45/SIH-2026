// Inventory Update Screen — Facility Stock Intake & Concurrency-Safe Adjustments
import React, { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../../services/inventory.service';
import { MedicineStock, StockTransactionType } from '../../types';
import { Colors, Spacing, Typography } from '../../theme';
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  StaleDataWarning,
  StatusBadge,
} from '../../components';

export interface InventoryUpdateScreenProps {
  facilityId: string;
  facilityName?: string;
  onNavigateBack?: () => void;
}

export const InventoryUpdateScreen: React.FC<InventoryUpdateScreenProps> = ({
  facilityId,
  facilityName = 'Healthcare Facility',
  onNavigateBack,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inventoryItems, setInventoryItems] = useState<MedicineStock[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date().toISOString());
  const [activeTab, setActiveTab] = useState<'LIST' | 'INTAKE' | 'ADJUST'>('LIST');

  // Intake Form State
  const [intakeMedicineId, setIntakeMedicineId] = useState('');
  const [intakeQty, setIntakeQty] = useState(100);
  const [intakeBatch, setIntakeBatch] = useState('');
  const [intakeExpiry, setIntakeExpiry] = useState('');
  const [intakeSupplier, setIntakeSupplier] = useState('');
  const [intakeSubmitting, setIntakeSubmitting] = useState(false);

  // Adjust Form State
  const [adjustMedicineId, setAdjustMedicineId] = useState('');
  const [adjustType, setAdjustType] = useState<StockTransactionType>('ISSUE');
  const [adjustQty, setAdjustQty] = useState(10);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await inventoryService.getFacilityInventory(facilityId, { limit: 50 });
      setInventoryItems(summary.items || []);
      setLastUpdatedAt(summary.lastUpdatedAt || new Date().toISOString());
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intakeMedicineId.trim() || intakeQty <= 0) return;
    setIntakeSubmitting(true);
    try {
      await inventoryService.recordIntake({
        facilityId,
        medicineId: intakeMedicineId.trim(),
        quantity: intakeQty,
        batchNumber: intakeBatch.trim() || undefined,
        expiryDate: intakeExpiry.trim() || undefined,
        supplier: intakeSupplier.trim() || undefined,
      });
      setIntakeMedicineId('');
      setIntakeBatch('');
      setIntakeExpiry('');
      setIntakeSupplier('');
      setActiveTab('LIST');
      fetchInventory();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Intake recording failed');
    } finally {
      setIntakeSubmitting(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustMedicineId.trim() || adjustQty <= 0) return;
    setAdjustSubmitting(true);
    try {
      await inventoryService.adjustStock({
        facilityId,
        medicineId: adjustMedicineId.trim(),
        type: adjustType,
        quantity: adjustQty,
        reason: adjustReason.trim() || undefined,
      });
      setAdjustMedicineId('');
      setAdjustReason('');
      setActiveTab('LIST');
      fetchInventory();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Adjustment failed');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  return (
    <div
      data-testid="inventory-update-screen"
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
            Manage Facility Inventory
          </h2>
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
            {facilityName} • Stock intake, batch logging, and adjustments
          </span>
        </div>

        <div style={{ display: 'flex', gap: Spacing.xs }}>
          <Button
            title="Stock Intake (+)"
            variant={activeTab === 'INTAKE' ? 'primary' : 'outline'}
            onPress={() => setActiveTab('INTAKE')}
          />
          <Button
            title="Adjust Stock (±)"
            variant={activeTab === 'ADJUST' ? 'primary' : 'outline'}
            onPress={() => setActiveTab('ADJUST')}
          />
        </div>
      </div>

      {/* Freshness Bar */}
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
        <StaleDataWarning lastUpdatedAt={lastUpdatedAt} resourceName="inventory records" />
        {activeTab !== 'LIST' && (
          <button
            onClick={() => setActiveTab('LIST')}
            style={{
              background: 'none',
              border: 'none',
              color: Colors.primary,
              cursor: 'pointer',
              fontSize: Typography.fontSizes.xs,
            }}
          >
            ← Back to Inventory List
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: Spacing.lg, overflowY: 'auto' }}>
        {error && <ErrorState title="Inventory Action Failed" message={error} onRetry={fetchInventory} />}

        {/* Tab: LIST */}
        {activeTab === 'LIST' && (
          <div>
            {loading && <LoadingState message="Loading inventory balance..." />}

            {!loading && inventoryItems.length === 0 && (
              <EmptyState
                title="Inventory Empty"
                description="No stock records currently logged for this facility."
                actionLabel="Record Intake"
                onAction={() => setActiveTab('INTAKE')}
              />
            )}

            {!loading && inventoryItems.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: Spacing.sm }}>
                {inventoryItems.map((item) => (
                  <div
                    key={item.id}
                    data-testid={`inventory-item-${item.id}`}
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
                        {item.medicine?.name || item.medicineId}
                      </div>
                      <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
                        Generic: {item.medicine?.genericName || 'N/A'} • Reorder Level: {item.reorderLevel}
                      </div>
                      {item.batchNumber && (
                        <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted, marginTop: 2 }}>
                          Batch: {item.batchNumber} {item.expiryDate ? `• Exp: ${item.expiryDate}` : ''}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: Spacing.xs }}>
                      <span style={{ fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: Colors.primary }}>
                        {item.currentStock} {item.unit}
                      </span>
                      <StatusBadge
                        label={item.currentStock === 0 ? 'Out of Stock' : item.currentStock <= item.reorderLevel ? 'Low Stock' : 'In Stock'}
                        variant={item.currentStock === 0 ? 'outOfStock' : item.currentStock <= item.reorderLevel ? 'lowStock' : 'available'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: INTAKE */}
        {activeTab === 'INTAKE' && (
          <form
            onSubmit={handleIntakeSubmit}
            data-testid="intake-form"
            style={{
              backgroundColor: Colors.surface,
              border: `1px solid ${Colors.border}`,
              borderRadius: Spacing.borderRadius.lg,
              padding: Spacing.lg,
              maxWidth: 500,
              margin: '0 auto',
            }}
          >
            <h3 style={{ margin: `0 0 ${Spacing.md}px`, fontSize: Typography.fontSizes.md, color: Colors.textPrimary }}>
              Record Stock Intake / Receipt
            </h3>

            <div style={{ marginBottom: Spacing.sm }}>
              <label style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>Medicine ID</label>
              <input
                type="text"
                required
                placeholder="e.g. med-paracetamol-500"
                value={intakeMedicineId}
                onChange={(e) => setIntakeMedicineId(e.target.value)}
                style={{ width: '100%', padding: Spacing.sm, marginTop: 4, borderRadius: Spacing.borderRadius.sm, border: `1px solid ${Colors.border}` }}
              />
            </div>

            <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.sm }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>Quantity</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={intakeQty}
                  onChange={(e) => setIntakeQty(Number(e.target.value))}
                  style={{ width: '100%', padding: Spacing.sm, marginTop: 4, borderRadius: Spacing.borderRadius.sm, border: `1px solid ${Colors.border}` }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>Batch Number</label>
                <input
                  type="text"
                  placeholder="e.g. BATCH-2026-A"
                  value={intakeBatch}
                  onChange={(e) => setIntakeBatch(e.target.value)}
                  style={{ width: '100%', padding: Spacing.sm, marginTop: 4, borderRadius: Spacing.borderRadius.sm, border: `1px solid ${Colors.border}` }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.md }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>Expiry Date</label>
                <input
                  type="date"
                  value={intakeExpiry}
                  onChange={(e) => setIntakeExpiry(e.target.value)}
                  style={{ width: '100%', padding: Spacing.sm, marginTop: 4, borderRadius: Spacing.borderRadius.sm, border: `1px solid ${Colors.border}` }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>Supplier</label>
                <input
                  type="text"
                  placeholder="e.g. District Central Store"
                  value={intakeSupplier}
                  onChange={(e) => setIntakeSupplier(e.target.value)}
                  style={{ width: '100%', padding: Spacing.sm, marginTop: 4, borderRadius: Spacing.borderRadius.sm, border: `1px solid ${Colors.border}` }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: Spacing.sm, justifyContent: 'flex-end' }}>
              <Button title="Cancel" variant="outline" onPress={() => setActiveTab('LIST')} />
              <Button title="Record Intake" onPress={() => {}} isLoading={intakeSubmitting} />
            </div>
          </form>
        )}

        {/* Tab: ADJUST */}
        {activeTab === 'ADJUST' && (
          <form
            onSubmit={handleAdjustSubmit}
            data-testid="adjust-form"
            style={{
              backgroundColor: Colors.surface,
              border: `1px solid ${Colors.border}`,
              borderRadius: Spacing.borderRadius.lg,
              padding: Spacing.lg,
              maxWidth: 500,
              margin: '0 auto',
            }}
          >
            <h3 style={{ margin: `0 0 ${Spacing.md}px`, fontSize: Typography.fontSizes.md, color: Colors.textPrimary }}>
              Concurrency-Safe Stock Adjustment
            </h3>

            <div style={{ marginBottom: Spacing.sm }}>
              <label style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>Medicine ID</label>
              <input
                type="text"
                required
                placeholder="e.g. med-paracetamol-500"
                value={adjustMedicineId}
                onChange={(e) => setAdjustMedicineId(e.target.value)}
                style={{ width: '100%', padding: Spacing.sm, marginTop: 4, borderRadius: Spacing.borderRadius.sm, border: `1px solid ${Colors.border}` }}
              />
            </div>

            <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.sm }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>Action Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as StockTransactionType)}
                  style={{ width: '100%', padding: Spacing.sm, marginTop: 4, borderRadius: Spacing.borderRadius.sm, border: `1px solid ${Colors.border}` }}
                >
                  <option value="ISSUE">ISSUE (Dispense / Decrement)</option>
                  <option value="RECEIPT">RECEIPT (Increment)</option>
                  <option value="ADJUSTMENT">ADJUSTMENT (Audit count sync)</option>
                  <option value="CORRECTION">CORRECTION (Error fix)</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>Quantity</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  style={{ width: '100%', padding: Spacing.sm, marginTop: 4, borderRadius: Spacing.borderRadius.sm, border: `1px solid ${Colors.border}` }}
                />
              </div>
            </div>

            <div style={{ marginBottom: Spacing.md }}>
              <label style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>Reason / Reference</label>
              <input
                type="text"
                placeholder="e.g. OPD Dispense, Damaged ampoule, Physical count discrepancy"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                style={{ width: '100%', padding: Spacing.sm, marginTop: 4, borderRadius: Spacing.borderRadius.sm, border: `1px solid ${Colors.border}` }}
              />
            </div>

            <div style={{ display: 'flex', gap: Spacing.sm, justifyContent: 'flex-end' }}>
              <Button title="Cancel" variant="outline" onPress={() => setActiveTab('LIST')} />
              <Button title="Confirm Adjustment" onPress={() => {}} isLoading={adjustSubmitting} />
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default InventoryUpdateScreen;
