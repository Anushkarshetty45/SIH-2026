// Medicine Availability Check Screen (Prescription-time multi-item check)
import React, { useState } from 'react';
import { inventoryService, PrescriptionCheckResult } from '../../services/inventory.service';
import { Colors, Spacing, Typography } from '../../theme';
import {
  Button,
  ErrorState,
  LoadingState,
  StaleDataWarning,
  StatusBadge,
} from '../../components';

export interface MedicineAvailabilityCheckScreenProps {
  facilityId: string;
  facilityName?: string;
  onNavigateBack?: () => void;
}

export const MedicineAvailabilityCheckScreen: React.FC<MedicineAvailabilityCheckScreenProps> = ({
  facilityId,
  facilityName = 'Healthcare Facility',
  onNavigateBack,
}) => {
  const [items, setItems] = useState<Array<{ medicineId: string; medicineName: string; quantity: number }>>([
    { medicineId: 'med-paracetamol-500', medicineName: 'Paracetamol 500mg', quantity: 20 },
    { medicineId: 'med-amoxicillin-500', medicineName: 'Amoxicillin 500mg', quantity: 15 },
  ]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedId, setNewMedId] = useState('');
  const [newQty, setNewQty] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PrescriptionCheckResult | null>(null);

  const handleAddItem = () => {
    if (!newMedName.trim() || !newMedId.trim()) return;
    setItems((prev) => [...prev, { medicineId: newMedId.trim(), medicineName: newMedName.trim(), quantity: newQty }]);
    setNewMedName('');
    setNewMedId('');
    setNewQty(10);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCheck = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryService.checkPrescriptionAvailability(
        facilityId,
        items.map((i) => ({ medicineId: i.medicineId, quantity: i.quantity })),
      );
      setResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Check failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="medicine-availability-check-screen"
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
            Prescription Availability Check
          </h2>
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
            {facilityName} • Multi-item fulfillment & controlled alternatives
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: Spacing.lg, overflowY: 'auto' }}>
        {/* Prescription Item List */}
        <div
          style={{
            backgroundColor: Colors.surface,
            border: `1px solid ${Colors.border}`,
            borderRadius: Spacing.borderRadius.lg,
            padding: Spacing.md,
            marginBottom: Spacing.md,
          }}
        >
          <h3 style={{ margin: `0 0 ${Spacing.sm}px`, fontSize: Typography.fontSizes.sm, color: Colors.textPrimary }}>
            Prescription Items ({items.length})
          </h3>

          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: `${Spacing.xs}px 0`,
                borderBottom: `1px solid ${Colors.border}`,
              }}
            >
              <div>
                <span style={{ fontWeight: Typography.fontWeights.medium, fontSize: Typography.fontSizes.sm }}>
                  {item.medicineName}
                </span>
                <span style={{ color: Colors.textMuted, fontSize: Typography.fontSizes.xs, marginLeft: Spacing.sm }}>
                  Qty: {item.quantity}
                </span>
              </div>
              <button
                onClick={() => handleRemoveItem(idx)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: Colors.status.outOfStock.text,
                  cursor: 'pointer',
                  fontSize: Typography.fontSizes.xs,
                }}
              >
                Remove
              </button>
            </div>
          ))}

          {/* Add Item Row */}
          <div style={{ display: 'flex', gap: Spacing.xs, marginTop: Spacing.md, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Medicine Name"
              value={newMedName}
              onChange={(e) => setNewMedName(e.target.value)}
              style={{
                flex: 2,
                padding: Spacing.xs,
                borderRadius: Spacing.borderRadius.sm,
                border: `1px solid ${Colors.border}`,
                fontSize: Typography.fontSizes.xs,
              }}
            />
            <input
              type="text"
              placeholder="Medicine ID"
              value={newMedId}
              onChange={(e) => setNewMedId(e.target.value)}
              style={{
                flex: 1,
                padding: Spacing.xs,
                borderRadius: Spacing.borderRadius.sm,
                border: `1px solid ${Colors.border}`,
                fontSize: Typography.fontSizes.xs,
              }}
            />
            <input
              type="number"
              value={newQty}
              onChange={(e) => setNewQty(Number(e.target.value))}
              style={{
                width: 60,
                padding: Spacing.xs,
                borderRadius: Spacing.borderRadius.sm,
                border: `1px solid ${Colors.border}`,
                fontSize: Typography.fontSizes.xs,
              }}
            />
            <Button title="Add" variant="outline" onPress={handleAddItem} />
          </div>

          <div style={{ marginTop: Spacing.md }}>
            <Button
              title="Verify All Items at Facility"
              onPress={handleCheck}
              isLoading={loading}
              testID="verify-prescription-btn"
            />
          </div>
        </div>

        {error && <ErrorState title="Verification Failed" message={error} onRetry={handleCheck} />}
        {loading && <LoadingState message="Checking inventory records..." />}

        {/* Results */}
        {!loading && result && (
          <div
            data-testid="prescription-check-result"
            style={{
              backgroundColor: Colors.surface,
              border: `1.5px solid ${result.allAvailable ? Colors.status.available.border : Colors.status.lowStock.border}`,
              borderRadius: Spacing.borderRadius.lg,
              padding: Spacing.md,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
              <h3 style={{ margin: 0, fontSize: Typography.fontSizes.md, color: Colors.textPrimary }}>
                {result.allAvailable ? '✅ All Medicines In Stock' : '⚠️ Partial Availability'}
              </h3>
              <StatusBadge
                label={result.allAvailable ? 'FULFILLABLE' : 'PARTIAL / ALTERNATIVES NEEDED'}
                variant={result.allAvailable ? 'available' : 'lowStock'}
              />
            </div>

            <StaleDataWarning
              lastUpdatedAt={result.lastUpdatedAt}
              resourceName="inventory"
            />

            <div style={{ marginTop: Spacing.md, display: 'flex', flexDirection: 'column', gap: Spacing.sm }}>
              {result.items.map((item) => (
                <div
                  key={item.medicineId}
                  style={{
                    padding: Spacing.sm,
                    backgroundColor: Colors.surfaceSubtle,
                    borderRadius: Spacing.borderRadius.sm,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: Typography.fontWeights.bold, fontSize: Typography.fontSizes.sm }}>
                      {item.medicineName}
                    </span>
                    <StatusBadge
                      label={item.isAvailable ? `In Stock (${item.currentStock})` : `Shortage (${item.currentStock}/${item.requestedQuantity})`}
                      variant={item.isAvailable ? 'available' : 'outOfStock'}
                    />
                  </div>

                  {!item.isAvailable && item.alternatives && item.alternatives.length > 0 && (
                    <div style={{ marginTop: Spacing.xs, paddingLeft: Spacing.sm, borderLeft: `2px solid ${Colors.status.lowStock.border}` }}>
                      <div style={{ fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.medium, color: Colors.textPrimary }}>
                        Available Alternatives:
                      </div>
                      {item.alternatives.map((alt) => (
                        <div key={alt.id} style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary, marginTop: 2 }}>
                          • {alt.name} ({alt.genericName}) — Stock: {alt.currentStock || 0}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicineAvailabilityCheckScreen;
