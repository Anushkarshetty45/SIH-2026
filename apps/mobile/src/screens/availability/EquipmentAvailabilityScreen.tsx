// Equipment Availability Screen — Real-time Facility Equipment Status & Freshness — React Native
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { equipmentService } from '../../services/equipment.service';
import { Equipment } from '../../types';
import { Colors, Spacing, Typography } from '../../theme';
import {
  Button,
  EmptyState,
  EquipmentCard,
  ErrorState,
  LoadingState,
  StaleDataWarning,
} from '../../components';

export interface EquipmentAvailabilityScreenProps {
  facilityId?: string;
  facilityName?: string;
  onSelectEquipment?: (equipment: Equipment) => void;
  onNavigateBack?: () => void;
}

export const EquipmentAvailabilityScreen: React.FC<EquipmentAvailabilityScreenProps> = (props) => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const facilityId = props.facilityId || route.params?.facilityId || 'fac-sdh-manchar';
  const facilityName = props.facilityName || route.params?.facilityName || 'Healthcare Facility';
  const onSelectEquipment = props.onSelectEquipment;
  const onNavigateBack = props.onNavigateBack || (navigation.canGoBack() ? () => navigation.goBack() : undefined);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date().toISOString());
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await equipmentService.getFacilityEquipment(facilityId);
      setEquipmentList(data.equipment || []);
      setLastUpdatedAt(data.lastUpdatedAt || new Date().toISOString());
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load equipment list');
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const filteredEquipment = equipmentList.filter((item) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'OPERATIONAL') return item.status === 'OPERATIONAL';
    if (selectedFilter === 'AVAILABLE_ONLY') return item.availableQuantity > 0;
    if (selectedFilter === 'MAINTENANCE')
      return item.status === 'UNDER_MAINTENANCE' || item.status === 'DEFECTIVE';
    return item.category.toUpperCase() === selectedFilter;
  });

  const totalAvailable = equipmentList.reduce((sum, item) => sum + item.availableQuantity, 0);
  const totalEquip = equipmentList.reduce((sum, item) => sum + item.totalQuantity, 0);

  return (
    <View testID="equipment-availability-screen" style={styles.container}>
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
          <Text style={styles.screenTitle}>Equipment Availability</Text>
          <Text style={styles.facilitySubtitle}>{facilityName}</Text>
        </View>

        <Button
          title="Refresh"
          variant="outline"
          onPress={fetchEquipment}
          isLoading={loading}
          testID="refresh-button"
        />
      </View>

      {/* Freshness Banner */}
      <View style={styles.freshnessBanner}>
        <StaleDataWarning
          lastUpdatedAt={lastUpdatedAt}
          resourceName="equipment"
          testID="freshness-indicator"
        />
        {!loading && (
          <Text style={styles.totalStatsText}>
            {totalAvailable} of {totalEquip} units operational
          </Text>
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {['ALL', 'AVAILABLE_ONLY', 'OPERATIONAL', 'MAINTENANCE'].map((filter) => {
          const isSelected = selectedFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              onPress={() => setSelectedFilter(filter)}
              testID={`filter-${filter}`}
              style={[
                styles.filterPill,
                isSelected && styles.filterPillSelected,
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.filterPillText,
                  isSelected && styles.filterPillTextSelected,
                ]}
              >
                {filter.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {loading && <LoadingState message="Loading equipment status..." />}

        {error && !loading && (
          <ErrorState
            title="Unable to Load Equipment"
            message={error}
            onRetry={fetchEquipment}
          />
        )}

        {!loading && !error && filteredEquipment.length === 0 && (
          <EmptyState
            title="No Equipment Found"
            description="No medical equipment matched your current filter criteria."
            actionLabel="Reset Filter"
            onAction={() => setSelectedFilter('ALL')}
          />
        )}

        {!loading && !error && filteredEquipment.length > 0 && (
          <View style={styles.list}>
            {filteredEquipment.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => onSelectEquipment && onSelectEquipment(item)}
                disabled={!onSelectEquipment}
                activeOpacity={onSelectEquipment ? 0.7 : 1}
              >
                <EquipmentCard
                  equipment={item}
                  testID={`equipment-card-${item.id}`}
                />
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
  freshnessBanner: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceSubtle,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalStatsText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },
  filterBar: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
  },
  filterPill: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Spacing.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginRight: Spacing.xs,
  },
  filterPillSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  filterPillText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.textSecondary,
  },
  filterPillTextSelected: {
    color: Colors.textInverse,
    fontWeight: Typography.fontWeights.bold,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  list: {
    flexDirection: 'column',
    gap: Spacing.sm,
  },
});

export default EquipmentAvailabilityScreen;
