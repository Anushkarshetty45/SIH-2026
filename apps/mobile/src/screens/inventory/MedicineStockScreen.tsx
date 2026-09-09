// Medicine Stock Screen — Facility-level stock with freshness, transactions & controlled alternatives — React Native
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
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
  facilityId?: string;
  facilityName?: string;
  medicine?: Medicine;
  onNavigateBack?: () => void;
  onSelectAlternative?: (alt: ControlledAlternative) => void;
}

export const MedicineStockScreen: React.FC<MedicineStockScreenProps> = (props) => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const facilityId = props.facilityId || route.params?.facilityId || 'fac-sdh-manchar';
  const facilityName = props.facilityName || route.params?.facilityName || 'Healthcare Facility';
  const medicine: Medicine = props.medicine || route.params?.medicine || {
    id: route.params?.medicineId || 'med-paracetamol-500',
    name: route.params?.medicineName || 'Paracetamol 500mg',
    genericName: 'Paracetamol',
    strength: '500mg',
    dosageForm: 'Tablet',
    category: 'Analgesic',
    unit: 'Tablets',
    isControlled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const onNavigateBack = props.onNavigateBack || (navigation.canGoBack() ? () => navigation.goBack() : undefined);
  const onSelectAlternative = props.onSelectAlternative;

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
      const [stockData, altData] = await Promise.all([
        inventoryService.getFacilityMedicineStock(facilityId, medicine.id).catch(() => null),
        medicineService.getAlternatives(medicine.id, facilityId).catch(() => null),
      ]);

      if (stockData) {
        setStock(stockData.stock);
        setTransactions(stockData.transactions || []);
        setLastUpdatedAt(stockData.lastUpdatedAt || new Date().toISOString());
      } else {
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
    <View testID="medicine-stock-screen" style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onNavigateBack && (
            <TouchableOpacity
              onPress={onNavigateBack}
              testID="back-button"
              style={styles.backButton}
              accessibilityRole="button"
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.screenTitle}>{medicine.name}</Text>
          <Text style={styles.facilitySubtitle}>
            {facilityName} • Generic: {medicine.genericName}
          </Text>
        </View>

        <Button
          title="Refresh"
          variant="outline"
          onPress={fetchStockAndAlternatives}
          isLoading={loading}
          testID="refresh-button"
        />
      </View>

      {/* Freshness Indicator */}
      <View style={styles.freshnessBar}>
        <StaleDataWarning
          lastUpdatedAt={lastUpdatedAt}
          resourceName="medicine inventory"
          testID="freshness-indicator"
        />
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {loading && <LoadingState message="Checking inventory records..." />}

        {error && !loading && (
          <ErrorState
            title="Stock Verification Error"
            message={error}
            onRetry={fetchStockAndAlternatives}
          />
        )}

        {!loading && !error && stock && (
          <View style={styles.stockLayout}>
            {/* Primary Stock Card */}
            <View>
              <Text style={styles.sectionLabel}>
                CURRENT STOCK LEVEL
              </Text>
              <MedicineStockCard
                stock={stock}
                alternatives={alternatives}
                testID="primary-stock-card"
              />
            </View>

            {/* Controlled Deterministic Alternatives */}
            {alternatives.length > 0 && (
              <View>
                <Text style={styles.sectionLabel}>
                  CONTROLLED DETERMINISTIC ALTERNATIVES
                </Text>
                <View style={styles.altList}>
                  {alternatives.map((alt) => (
                    <View
                      key={alt.id}
                      style={styles.altCard}
                      testID={`alt-item-${alt.id}`}
                    >
                      <View style={styles.altInfo}>
                        <Text style={styles.altName}>
                          {alt.name}
                        </Text>
                        <Text style={styles.altGeneric}>
                          Generic: {alt.genericName} ({alt.strength}, {alt.dosageForm})
                        </Text>
                        {alt.notes && (
                          <Text style={styles.altNotes}>
                            {alt.notes}
                          </Text>
                        )}
                      </View>

                      <View style={styles.altActionCol}>
                        <StatusBadge
                          label={alt.isAvailableAtFacility ? `In Stock (${alt.currentStock || 0})` : 'Out of Stock'}
                          variant={alt.isAvailableAtFacility ? 'available' : 'outOfStock'}
                        />
                        {onSelectAlternative && (
                          <View style={styles.selectBtnWrapper}>
                            <Button
                              title="Select"
                              variant="outline"
                              onPress={() => onSelectAlternative(alt)}
                            />
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Recent Transactions */}
            {transactions.length > 0 && (
              <View>
                <Text style={styles.sectionLabel}>
                  RECENT STOCK TRANSACTIONS
                </Text>
                <View style={styles.transactionsContainer}>
                  {transactions.map((tx) => (
                    <View key={tx.id} style={styles.transactionRow}>
                      <View>
                        <Text style={styles.txType}>
                          {tx.type} • {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity} {stock.unit}
                        </Text>
                        <Text style={styles.txDate}>
                          {new Date(tx.createdAt).toLocaleDateString()} {tx.batchNumber ? `(Batch: ${tx.batchNumber})` : ''}
                        </Text>
                      </View>
                      <Text style={styles.txBalance}>
                        Balance: {tx.balanceAfter}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  backButton: {
    marginBottom: Spacing.xs,
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
  },
  screenTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  facilitySubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  freshnessBar: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceSubtle,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  stockLayout: {
    flexDirection: 'column',
    gap: Spacing.lg,
  },
  sectionLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: Typography.fontWeights.semibold,
  },
  altList: {
    flexDirection: 'column',
    gap: Spacing.sm,
  },
  altCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  altInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  altName: {
    fontWeight: Typography.fontWeights.bold,
    fontSize: Typography.fontSizes.sm,
    color: Colors.textPrimary,
  },
  altGeneric: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  altNotes: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  altActionCol: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  selectBtnWrapper: {
    marginTop: 4,
  },
  transactionsContainer: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.md,
    overflow: 'hidden',
  },
  transactionRow: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txType: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  txDate: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  txBalance: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
  },
});

export default MedicineStockScreen;
