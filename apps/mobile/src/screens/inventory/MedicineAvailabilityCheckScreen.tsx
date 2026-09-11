// Medicine Availability Check Screen (Prescription-time multi-item check) — React Native
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { inventoryService, PrescriptionCheckResult } from '../../services/inventory.service';
import { Colors, Spacing, Typography } from '../../theme';
import {
  Button,
  ErrorState,
  LoadingState,
  StaleDataWarning,
  StatusBadge,
  TextInput,
} from '../../components';

export interface MedicineAvailabilityCheckScreenProps {
  facilityId?: string;
  facilityName?: string;
  onNavigateBack?: () => void;
}

export const MedicineAvailabilityCheckScreen: React.FC<MedicineAvailabilityCheckScreenProps> = (props) => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const facilityId = props.facilityId || route.params?.facilityId || 'fac-sdh-manchar';
  const facilityName = props.facilityName || route.params?.facilityName || 'Healthcare Facility';
  const onNavigateBack = props.onNavigateBack || (navigation.canGoBack() ? () => navigation.goBack() : undefined);

  const [items, setItems] = useState<Array<{ medicineId: string; medicineName: string; quantity: number }>>([
    { medicineId: 'med-paracetamol-500', medicineName: 'Paracetamol 500mg', quantity: 20 },
    { medicineId: 'med-amoxicillin-500', medicineName: 'Amoxicillin 500mg', quantity: 15 },
  ]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedId, setNewMedId] = useState('');
  const [newQty, setNewQty] = useState('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PrescriptionCheckResult | null>(null);

  const handleAddItem = () => {
    if (!newMedName.trim() || !newMedId.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        medicineId: newMedId.trim(),
        medicineName: newMedName.trim(),
        quantity: parseInt(newQty, 10) || 10,
      },
    ]);
    setNewMedName('');
    setNewMedId('');
    setNewQty('10');
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
    <View testID="medicine-availability-check-screen" style={styles.container}>
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
          <Text style={styles.screenTitle}>Prescription Check</Text>
          <Text style={styles.facilitySubtitle}>
            {facilityName} • Multi-item fulfillment & alternatives
          </Text>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Prescription Item List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Prescription Items ({items.length})
          </Text>

          {items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.medicineName}</Text>
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveItem(idx)}
                accessibilityRole="button"
              >
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Add Item Row */}
          <View style={styles.addRow}>
            <TextInput
              label="Medicine Name"
              placeholder="e.g. Cetirizine 10mg"
              value={newMedName}
              onChangeText={setNewMedName}
            />
            <View style={styles.addFieldsRow}>
              <View style={styles.addCol}>
                <TextInput
                  label="Medicine ID"
                  placeholder="e.g. med-cetirizine-10"
                  value={newMedId}
                  onChangeText={setNewMedId}
                />
              </View>
              <View style={styles.addColSmall}>
                <TextInput
                  label="Qty"
                  value={newQty}
                  onChangeText={setNewQty}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <Button title="+ Add Item" variant="outline" onPress={handleAddItem} />
          </View>

          <View style={styles.verifyButtonWrapper}>
            <Button
              title="Verify All Items at Facility"
              onPress={handleCheck}
              isLoading={loading}
              testID="verify-prescription-btn"
            />
          </View>
        </View>

        {error && <ErrorState title="Verification Failed" message={error} onRetry={handleCheck} />}
        {loading && <LoadingState message="Checking inventory records..." />}

        {/* Results */}
        {!loading && result && (
          <View
            testID="prescription-check-result"
            style={[
              styles.resultsCard,
              {
                borderColor: result.allAvailable
                  ? Colors.status.available.border
                  : Colors.status.lowStock.border,
              },
            ]}
          >
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                {result.allAvailable ? '✅ All Medicines In Stock' : '⚠️ Partial Availability'}
              </Text>
              <StatusBadge
                label={result.allAvailable ? 'FULFILLABLE' : 'PARTIAL / ALTERNATIVES NEEDED'}
                variant={result.allAvailable ? 'available' : 'lowStock'}
              />
            </View>

            <StaleDataWarning
              lastUpdatedAt={result.lastUpdatedAt}
              resourceName="inventory"
            />

            <View style={styles.resultsList}>
              {result.items.map((item) => (
                <View key={item.medicineId} style={styles.resultItemBox}>
                  <View style={styles.resultItemTop}>
                    <Text style={styles.resultItemName}>
                      {item.medicineName}
                    </Text>
                    <StatusBadge
                      label={
                        item.isAvailable
                          ? `In Stock (${item.currentStock})`
                          : `Shortage (${item.currentStock}/${item.requestedQuantity})`
                      }
                      variant={item.isAvailable ? 'available' : 'outOfStock'}
                    />
                  </View>

                  {!item.isAvailable && item.alternatives && item.alternatives.length > 0 && (
                    <View style={styles.alternativesBox}>
                      <Text style={styles.alternativesLabel}>
                        Available Alternatives:
                      </Text>
                      {item.alternatives.map((alt) => (
                        <Text key={alt.id} style={styles.altText}>
                          • {alt.name} ({alt.genericName}) — Stock: {alt.currentStock || 0}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
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
  contentContainer: {
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  itemName: {
    fontWeight: Typography.fontWeights.medium,
    fontSize: Typography.fontSizes.sm,
    color: Colors.textPrimary,
  },
  itemQty: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizes.xs,
  },
  removeText: {
    color: Colors.status.outOfStock.text,
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
  },
  addRow: {
    marginTop: Spacing.md,
  },
  addFieldsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  addCol: {
    flex: 2,
  },
  addColSmall: {
    flex: 1,
  },
  verifyButtonWrapper: {
    marginTop: Spacing.md,
  },
  resultsCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.md,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  resultsTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  resultsList: {
    marginTop: Spacing.md,
    flexDirection: 'column',
    gap: Spacing.sm,
  },
  resultItemBox: {
    padding: Spacing.sm,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Spacing.borderRadius.sm,
  },
  resultItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultItemName: {
    fontWeight: Typography.fontWeights.bold,
    fontSize: Typography.fontSizes.sm,
    color: Colors.textPrimary,
  },
  alternativesBox: {
    marginTop: Spacing.xs,
    paddingLeft: Spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: Colors.status.lowStock.border,
  },
  alternativesLabel: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.textPrimary,
  },
  altText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

export default MedicineAvailabilityCheckScreen;
