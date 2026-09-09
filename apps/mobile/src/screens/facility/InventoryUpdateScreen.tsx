// Inventory Update Screen — Facility Stock Intake & Concurrency-Safe Adjustments — React Native
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
import { MedicineStock, StockTransactionType } from '../../types';
import { Colors, Spacing, Typography } from '../../theme';
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  StaleDataWarning,
  StatusBadge,
  TextInput,
} from '../../components';

export interface InventoryUpdateScreenProps {
  facilityId?: string;
  facilityName?: string;
  onNavigateBack?: () => void;
}

export const InventoryUpdateScreen: React.FC<InventoryUpdateScreenProps> = (props) => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const facilityId = props.facilityId || route.params?.facilityId || 'fac-sdh-manchar';
  const facilityName = props.facilityName || route.params?.facilityName || 'Healthcare Facility';
  const onNavigateBack = props.onNavigateBack || (navigation.canGoBack() ? () => navigation.goBack() : undefined);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inventoryItems, setInventoryItems] = useState<MedicineStock[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date().toISOString());
  const [activeTab, setActiveTab] = useState<'LIST' | 'INTAKE' | 'ADJUST'>('LIST');

  // Intake Form State
  const [intakeMedicineId, setIntakeMedicineId] = useState('');
  const [intakeQty, setIntakeQty] = useState('100');
  const [intakeBatch, setIntakeBatch] = useState('');
  const [intakeExpiry, setIntakeExpiry] = useState('');
  const [intakeSupplier, setIntakeSupplier] = useState('');
  const [intakeSubmitting, setIntakeSubmitting] = useState(false);

  // Adjust Form State
  const [adjustMedicineId, setAdjustMedicineId] = useState('');
  const [adjustType, setAdjustType] = useState<StockTransactionType>('ISSUE');
  const [adjustQty, setAdjustQty] = useState('10');
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

  const handleIntakeSubmit = async () => {
    const qty = parseInt(intakeQty, 10) || 0;
    if (!intakeMedicineId.trim() || qty <= 0) return;
    setIntakeSubmitting(true);
    try {
      await inventoryService.recordIntake({
        facilityId,
        medicineId: intakeMedicineId.trim(),
        quantity: qty,
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

  const handleAdjustSubmit = async () => {
    const qty = parseInt(adjustQty, 10) || 0;
    if (!adjustMedicineId.trim() || qty <= 0) return;
    setAdjustSubmitting(true);
    try {
      await inventoryService.adjustStock({
        facilityId,
        medicineId: adjustMedicineId.trim(),
        type: adjustType,
        quantity: qty,
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
    <View testID="inventory-update-screen" style={styles.container}>
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
          <Text style={styles.screenTitle}>Manage Facility Inventory</Text>
          <Text style={styles.facilitySubtitle}>
            {facilityName} • Stock intake, batch logging, adjustments
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Button
            title="Intake (+)"
            variant={activeTab === 'INTAKE' ? 'primary' : 'outline'}
            onPress={() => setActiveTab('INTAKE')}
          />
          <Button
            title="Adjust (±)"
            variant={activeTab === 'ADJUST' ? 'primary' : 'outline'}
            onPress={() => setActiveTab('ADJUST')}
          />
        </View>
      </View>

      {/* Freshness Bar */}
      <View style={styles.freshnessBar}>
        <StaleDataWarning lastUpdatedAt={lastUpdatedAt} resourceName="inventory records" />
        {activeTab !== 'LIST' && (
          <TouchableOpacity onPress={() => setActiveTab('LIST')} style={styles.backToListButton}>
            <Text style={styles.backToListText}>← Back to List</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Content Area */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {error && <ErrorState title="Inventory Action Failed" message={error} onRetry={fetchInventory} />}

        {/* Tab: LIST */}
        {activeTab === 'LIST' && (
          <View>
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
              <View style={styles.list}>
                {inventoryItems.map((item) => (
                  <View
                    key={item.id}
                    testID={`inventory-item-${item.id}`}
                    style={styles.itemCard}
                  >
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>
                        {item.medicine?.name || item.medicineId}
                      </Text>
                      <Text style={styles.itemMeta}>
                        Generic: {item.medicine?.genericName || 'N/A'} • Reorder Level: {item.reorderLevel}
                      </Text>
                      {item.batchNumber && (
                        <Text style={styles.itemBatch}>
                          Batch: {item.batchNumber} {item.expiryDate ? `• Exp: ${item.expiryDate}` : ''}
                        </Text>
                      )}
                    </View>

                    <View style={styles.itemStockCol}>
                      <Text style={styles.itemStockQty}>
                        {item.currentStock} {item.unit}
                      </Text>
                      <StatusBadge
                        label={
                          item.currentStock === 0
                            ? 'Out of Stock'
                            : item.currentStock <= item.reorderLevel
                            ? 'Low Stock'
                            : 'In Stock'
                        }
                        variant={
                          item.currentStock === 0
                            ? 'outOfStock'
                            : item.currentStock <= item.reorderLevel
                            ? 'lowStock'
                            : 'available'
                        }
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Tab: INTAKE */}
        {activeTab === 'INTAKE' && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              Record Stock Intake / Receipt
            </Text>

            <TextInput
              label="Medicine ID"
              placeholder="e.g. med-paracetamol-500"
              value={intakeMedicineId}
              onChangeText={setIntakeMedicineId}
              required
            />

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <TextInput
                  label="Quantity"
                  value={intakeQty}
                  onChangeText={setIntakeQty}
                  keyboardType="numeric"
                  required
                />
              </View>
              <View style={styles.formCol}>
                <TextInput
                  label="Batch Number"
                  placeholder="e.g. BATCH-2026-A"
                  value={intakeBatch}
                  onChangeText={setIntakeBatch}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <TextInput
                  label="Expiry Date"
                  placeholder="YYYY-MM-DD"
                  value={intakeExpiry}
                  onChangeText={setIntakeExpiry}
                />
              </View>
              <View style={styles.formCol}>
                <TextInput
                  label="Supplier"
                  placeholder="e.g. District Central Store"
                  value={intakeSupplier}
                  onChangeText={setIntakeSupplier}
                />
              </View>
            </View>

            <View style={styles.formActions}>
              <View style={styles.actionBtn}>
                <Button title="Cancel" variant="outline" onPress={() => setActiveTab('LIST')} />
              </View>
              <View style={styles.actionBtn}>
                <Button title="Record Intake" onPress={handleIntakeSubmit} isLoading={intakeSubmitting} />
              </View>
            </View>
          </View>
        )}

        {/* Tab: ADJUST */}
        {activeTab === 'ADJUST' && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              Concurrency-Safe Stock Adjustment
            </Text>

            <TextInput
              label="Medicine ID"
              placeholder="e.g. med-paracetamol-500"
              value={adjustMedicineId}
              onChangeText={setAdjustMedicineId}
              required
            />

            <Text style={styles.actionTypeLabel}>Action Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typePillsRow}>
              {(['ISSUE', 'RECEIPT', 'ADJUSTMENT', 'CORRECTION'] as StockTransactionType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setAdjustType(type)}
                  style={[
                    styles.typePill,
                    adjustType === type && styles.typePillActive,
                  ]}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.typePillText,
                      adjustType === type && styles.typePillTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              label="Quantity"
              value={adjustQty}
              onChangeText={setAdjustQty}
              keyboardType="numeric"
              required
            />

            <TextInput
              label="Reason / Reference"
              placeholder="e.g. OPD Dispense, Damaged ampoule"
              value={adjustReason}
              onChangeText={setAdjustReason}
            />

            <View style={styles.formActions}>
              <View style={styles.actionBtn}>
                <Button title="Cancel" variant="outline" onPress={() => setActiveTab('LIST')} />
              </View>
              <View style={styles.actionBtn}>
                <Button title="Confirm Adjustment" onPress={handleAdjustSubmit} isLoading={adjustSubmitting} />
              </View>
            </View>
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
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  freshnessBar: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceSubtle,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backToListButton: {
    padding: Spacing.xs,
  },
  backToListText: {
    color: Colors.primary,
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  list: {
    flexDirection: 'column',
    gap: Spacing.sm,
  },
  itemCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  itemName: {
    fontWeight: Typography.fontWeights.bold,
    fontSize: Typography.fontSizes.md,
    color: Colors.textPrimary,
  },
  itemMeta: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemBatch: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  itemStockCol: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  itemStockQty: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primary,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  formTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  formCol: {
    flex: 1,
  },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
    marginTop: Spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
  actionTypeLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  typePillsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  typePill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSubtle,
    marginRight: 6,
  },
  typePillActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  typePillText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  typePillTextActive: {
    color: Colors.primary,
    fontWeight: Typography.fontWeights.bold,
  },
});

export default InventoryUpdateScreen;
