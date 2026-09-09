// Medicine Stock Screen — Facility-level stock with freshness, transactions & controlled alternatives
import React, { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../../services/inventory.service';
import { medicineService } from '../../services/medicine.service';
import {
  Medicine,
  MedicineStock,
  StockTransaction,
  ControlledAlternative,
} from '../../types';
import { Colors, Spacing, Typography } from '../../theme';
import {
  Button,
  ErrorState,
  LoadingState,
  MedicineStockCard,
  StaleDataWarning,
  StatusBadge,
} from '../../components';

export interface MedicineStockScreenProps {
  facilityId: string;
  facilityName?: string;
  medicine: Medicine;
  onNavigateBack?: () => void;
  onSelectAlternative?: (alt: ControlledAlternative) => void;
}

export const MedicineStockScreen: React.FC<MedicineStockScreenProps> = ({
  facilityId,
  facilityName = 'Healthcare Facility',
  medicine,
  onNavigateBack,
  onSelectAlternative,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stock, setStock] = useState<MedicineStock | null>(null);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [alternatives, setAlternatives] = useState<ControlledAlternative[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date().toISOString());

  const fetchStockAndAlternatives = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both stock and alternatives in parallel
      const [stockData, altData] = await Promise.all([
        inventoryService.getFacilityMedicineStock(facilityId, medicine.id).catch(() => null),
        medicineService.getAlternatives(medicine.id, facilityId).catch(() => null),
      ]);

      if (stockData) {
        setStock(stockData.stock);
        setTransactions(stockData.transactions || []);
        setLastUpdatedAt(stockData.lastUpdatedAt || new Date().toISOString());
      } else {
        // Construct fallback zero-stock object
        setStock({
          id: `stock-${medicine.id}`,
          facilityId,
          medicineId: medicine.id,
          currentStock: 0,
          reorderLevel: 10,
          unit: medicine.unit,
          lastUpdatedAt: new Date().toISOString(),
          medicine,
        });
      }

      if (altData) {
        setAlternatives([
          ...(altData.controlledAlternatives || []),
          ...(altData.genericEquivalents || []),
        ]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load medicine stock');
    } finally {
      setLoading(false);
    }
  }, [facilityId, medicine]);

  useEffect(() => {
    fetchStockAndAlternatives();
  }, [fetchStockAndAlternatives]);

  return (
    <div
      data-testid="medicine-stock-screen"
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
            {medicine.name}
          </h2>
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
            {facilityName} • Generic: {medicine.genericName}
          </span>
        </div>

        <Button
          title="Refresh"
          variant="outline"
          onPress={fetchStockAndAlternatives}
          isLoading={loading}
          testID="refresh-button"
        />
      </div>

      {/* Freshness Indicator */}
      <div
        style={{
          padding: `${Spacing.sm}px ${Spacing.lg}px`,
          backgroundColor: Colors.surfaceSubtle,
          borderBottom: `1px solid ${Colors.border}`,
        }}
      >
        <StaleDataWarning
          lastUpdatedAt={lastUpdatedAt}
          resourceName="medicine inventory"
          testID="freshness-indicator"
        />
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: Spacing.lg, overflowY: 'auto' }}>
        {loading && <LoadingState message="Checking inventory records..." />}

        {error && !loading && (
          <ErrorState
            title="Stock Verification Error"
            message={error}
            onRetry={fetchStockAndAlternatives}
          />
        )}

        {!loading && !error && stock && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: Spacing.lg }}>
            {/* Primary Stock Card */}
            <div>
              <h4 style={{ margin: `0 0 ${Spacing.xs}px`, fontSize: Typography.fontSizes.sm, color: Colors.textSecondary }}>
                CURRENT STOCK LEVEL
              </h4>
              <MedicineStockCard
                stock={stock}
                alternatives={alternatives}
                testID="primary-stock-card"
              />
            </div>

            {/* Controlled Deterministic Alternatives */}
            {alternatives.length > 0 && (
              <div>
                <h4 style={{ margin: `0 0 ${Spacing.xs}px`, fontSize: Typography.fontSizes.sm, color: Colors.textSecondary }}>
                  CONTROLLED DETERMINISTIC ALTERNATIVES
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: Spacing.sm }}>
                  {alternatives.map((alt) => (
                    <div
                      key={alt.id}
                      style={{
                        backgroundColor: Colors.surface,
                        border: `1px solid ${Colors.border}`,
                        borderRadius: Spacing.borderRadius.md,
                        padding: Spacing.md,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                      data-testid={`alt-item-${alt.id}`}
                    >
                      <div>
                        <div style={{ fontWeight: Typography.fontWeights.bold, fontSize: Typography.fontSizes.sm, color: Colors.textPrimary }}>
                          {alt.name}
                        </div>
                        <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
                          Generic: {alt.genericName} ({alt.strength}, {alt.dosageForm})
                        </div>
                        {alt.notes && (
                          <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted, marginTop: 2 }}>
                            {alt.notes}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
                        <StatusBadge
                          label={alt.isAvailableAtFacility ? `In Stock (${alt.currentStock || 0})` : 'Out of Stock'}
                          variant={alt.isAvailableAtFacility ? 'available' : 'outOfStock'}
                        />
                        {onSelectAlternative && (
                          <Button
                            title="Select"
                            variant="outline"
                            onPress={() => onSelectAlternative(alt)}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            {transactions.length > 0 && (
              <div>
                <h4 style={{ margin: `0 0 ${Spacing.xs}px`, fontSize: Typography.fontSizes.sm, color: Colors.textSecondary }}>
                  RECENT STOCK TRANSACTIONS
                </h4>
                <div
                  style={{
                    backgroundColor: Colors.surface,
                    border: `1px solid ${Colors.border}`,
                    borderRadius: Spacing.borderRadius.md,
                    overflow: 'hidden',
                  }}
                >
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      style={{
                        padding: `${Spacing.sm}px ${Spacing.md}px`,
                        borderBottom: `1px solid ${Colors.border}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary }}>
                          {tx.type} • {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity} {stock.unit}
                        </div>
                        <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>
                          {new Date(tx.createdAt).toLocaleDateString()} {tx.batchNumber ? `(Batch: ${tx.batchNumber})` : ''}
                        </div>
                      </div>
                      <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
                        Balance: {tx.balanceAfter}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicineStockScreen;
