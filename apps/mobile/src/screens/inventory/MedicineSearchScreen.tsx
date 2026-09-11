// Medicine Search Screen — Search Master Catalog with Generic Lookup & Deterministic Alternatives — React Native
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { medicineService } from '../../services/medicine.service';
import { Medicine } from '../../types';
import { Colors, Spacing, Typography } from '../../theme';
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  TextInput,
} from '../../components';

export interface MedicineSearchScreenProps {
  facilityId?: string;
  onSelectMedicine?: (medicine: Medicine) => void;
  onNavigateBack?: () => void;
}

export const MedicineSearchScreen: React.FC<MedicineSearchScreenProps> = (props) => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const onSelectMedicine = props.onSelectMedicine || ((med: Medicine) => {
    navigation.navigate('MedicineStock', { medicineId: med.id, medicineName: med.name });
  });
  const onNavigateBack = props.onNavigateBack || (navigation.canGoBack() ? () => navigation.goBack() : undefined);

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  const searchMedicines = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await medicineService.searchMedicines({
        search: query.trim() || undefined,
        limit: 25,
      });
      setMedicines(response.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to search medicine catalog');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    searchMedicines('');
  }, [searchMedicines]);

  return (
    <View testID="medicine-search-screen" style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
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
          <View>
            <Text style={styles.screenTitle}>Medicine Catalog Search</Text>
            <Text style={styles.screenSubtitle}>
              Search by brand name or generic formula
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <TextInput
              value={searchTerm}
              onChangeText={(text) => {
                setSearchTerm(text);
                if (text.length === 0 || text.length > 2) {
                  searchMedicines(text);
                }
              }}
              placeholder="e.g. Paracetamol, Amoxicillin..."
              testID="medicine-search-input"
            />
          </View>
          <Button
            title="Search"
            onPress={() => searchMedicines(searchTerm)}
            testID="search-submit-btn"
          />
        </View>
      </View>

      {/* Results List */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {loading && <LoadingState message="Searching medicines catalog..." />}

        {error && !loading && (
          <ErrorState
            title="Search Failed"
            message={error}
            onRetry={() => searchMedicines(searchTerm)}
          />
        )}

        {!loading && !error && medicines.length === 0 && (
          <EmptyState
            title="No Medicines Found"
            description={
              searchTerm
                ? `No results matched "${searchTerm}". Check the spelling or search by generic chemical name.`
                : 'Type a medicine name in the search bar above.'
            }
          />
        )}

        {!loading && !error && medicines.length > 0 && (
          <View style={styles.list}>
            {medicines.map((medicine) => (
              <TouchableOpacity
                key={medicine.id}
                onPress={() => onSelectMedicine && onSelectMedicine(medicine)}
                testID={`medicine-item-${medicine.id}`}
                style={styles.medicineCard}
                activeOpacity={0.7}
              >
                <View style={styles.medicineInfo}>
                  <Text style={styles.medicineName}>
                    {medicine.name}
                  </Text>
                  <Text style={styles.genericText}>
                    Generic: <Text style={styles.bold}>{medicine.genericName}</Text>
                  </Text>
                  <Text style={styles.detailsText}>
                    {medicine.strength} • {medicine.dosageForm} • Unit: {medicine.unit}
                  </Text>
                </View>

                <View style={styles.actionWrapper}>
                  <Button
                    title="View Stock →"
                    variant="outline"
                    onPress={() => onSelectMedicine && onSelectMedicine(medicine)}
                  />
                </View>
              </TouchableOpacity>
            ))}
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  backButton: {
    marginRight: Spacing.md,
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
  screenSubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  searchInputWrapper: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  list: {
    flexDirection: 'column',
    gap: Spacing.sm,
  },
  medicineCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicineInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  medicineName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  genericText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bold: {
    fontWeight: Typography.fontWeights.medium,
  },
  detailsText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  actionWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default MedicineSearchScreen;
