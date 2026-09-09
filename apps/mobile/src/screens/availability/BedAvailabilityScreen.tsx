// Bed Availability Screen — Real-time Bed Counts with Freshness & Stale Data Warnings — React Native
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { bedService, EmergencyBedAvailability } from '../../services/bed.service';
import { BedCategory, FacilityBedSummary } from '../../types';
import { Colors, Spacing, Typography } from '../../theme';
import {
  BedAvailabilityCard,
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  StaleDataWarning,
  StatusBadge,
} from '../../components';

export interface BedAvailabilityScreenProps {
  facilityId?: string;
  facilityName?: string;
  onSelectCategory?: (category: BedCategory) => void;
  onNavigateBack?: () => void;
}

export const BedAvailabilityScreen: React.FC<BedAvailabilityScreenProps> = (props) => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const facilityId = props.facilityId || route.params?.facilityId || 'fac-sdh-manchar';
  const facilityName = props.facilityName || route.params?.facilityName || 'Healthcare Facility';
  const onSelectCategory = props.onSelectCategory;
  const onNavigateBack = props.onNavigateBack || (navigation.canGoBack() ? () => navigation.goBack() : undefined);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<FacilityBedSummary[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date().toISOString());
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [emergencyMode, setEmergencyMode] = useState<boolean>(false);
  const [emergencyBeds, setEmergencyBeds] = useState<EmergencyBedAvailability[]>([]);

  const fetchBedData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (emergencyMode) {
        const emergencyData = await bedService.getEmergencyBedAvailability(facilityId);
        setEmergencyBeds(emergencyData);
        if (emergencyData.length > 0) {
          setLastUpdatedAt(emergencyData[0].lastUpdatedAt);
        }
      } else {
        const data = await bedService.getFacilityBedSummary(facilityId);
        setCategories(data.categories || []);
        setLastUpdatedAt(data.lastUpdatedAt || new Date().toISOString());
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load bed availability');
    } finally {
      setLoading(false);
    }
  }, [facilityId, emergencyMode]);

  useEffect(() => {
    fetchBedData();
  }, [fetchBedData]);

  const filteredCategories = categories.filter((c) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'AVAILABLE_ONLY') return c.available > 0;
    return c.category === selectedFilter;
  });

  const totalBeds = categories.reduce((sum, c) => sum + c.total, 0);
  const totalAvailable = categories.reduce((sum, c) => sum + c.available, 0);

  return (
    <View testID="bed-availability-screen" style={styles.container}>
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
          <Text style={styles.screenTitle}>Bed Availability</Text>
          <Text style={styles.facilitySubtitle}>{facilityName}</Text>
        </View>

        <View style={styles.headerRight}>
          <Button
            title={emergencyMode ? 'Standard' : '🚨 Emergency'}
            variant={emergencyMode ? 'secondary' : 'primary'}
            onPress={() => setEmergencyMode(!emergencyMode)}
            testID="emergency-mode-toggle"
          />
          <Button
            title="Refresh"
            variant="outline"
            onPress={fetchBedData}
            isLoading={loading}
            testID="refresh-button"
          />
        </View>
      </View>

      {/* Freshness Banner */}
      <View style={styles.freshnessBanner}>
        <StaleDataWarning
          lastUpdatedAt={lastUpdatedAt}
          resourceName="bed counts"
          isEmergencyMode={emergencyMode}
          testID="freshness-indicator"
        />
        {!loading && !emergencyMode && (
          <Text style={styles.totalStatsText}>
            {totalAvailable} of {totalBeds} beds available
          </Text>
        )}
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {loading && <LoadingState message="Loading live bed availability..." />}

        {error && !loading && (
          <ErrorState
            title="Unable to Load Bed Availability"
            message={error}
            onRetry={fetchBedData}
          />
        )}

        {!loading && !error && emergencyMode && (
          <View>
            <View style={styles.emergencyWarningBox}>
              <Text style={styles.emergencyWarningTitle}>
                Emergency Bed Availability (ICU / Oxygen / Ventilator)
              </Text>
              <Text style={styles.emergencyWarningText}>
                Rule 11: Emergency data older than 2 hours requires verbal re-confirmation prior to transfer.
              </Text>
            </View>

            {emergencyBeds.map((facility) => (
              <View key={facility.facilityId} style={styles.emergencyCard}>
                <View style={styles.emergencyCardHeader}>
                  <Text style={styles.emergencyFacilityName}>{facility.facilityName}</Text>
                  {facility.unreliableForEmergency && (
                    <StatusBadge label="VERIFY FIRST" variant="timedOut" />
                  )}
                </View>

                <View style={styles.metricsGrid}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>ICU</Text>
                    <Text style={styles.metricValue}>
                      {facility.icuAvailable} / {facility.icuTotal}
                    </Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Oxygen</Text>
                    <Text style={styles.metricValue}>
                      {facility.oxygenAvailable} / {facility.oxygenTotal}
                    </Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Ventilator</Text>
                    <Text style={styles.metricValue}>
                      {facility.ventilatorAvailable} / {facility.ventilatorTotal}
                    </Text>
                  </View>
                </View>

                <View style={styles.emergencyStaleContainer}>
                  <StaleDataWarning
                    lastUpdatedAt={facility.lastUpdatedAt}
                    isEmergencyMode={true}
                    resourceName="emergency beds"
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {!loading && !error && !emergencyMode && (
          <View>
            {/* Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              {['ALL', 'AVAILABLE_ONLY', 'GENERAL', 'ICU', 'OXYGEN', 'VENTILATOR', 'MATERNITY', 'PEDIATRIC'].map(
                (filter) => {
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
                },
              )}
            </ScrollView>

            {filteredCategories.length === 0 ? (
              <EmptyState
                title="No Bed Records Found"
                description="No beds matched your selected category filter."
                actionLabel="Show All"
                onAction={() => setSelectedFilter('ALL')}
              />
            ) : (
              filteredCategories.map((item) => (
                <TouchableOpacity
                  key={item.category}
                  onPress={() => onSelectCategory && onSelectCategory(item.category)}
                  disabled={!onSelectCategory}
                  activeOpacity={onSelectCategory ? 0.7 : 1}
                >
                  <BedAvailabilityCard
                    category={item.category}
                    availableCount={item.available}
                    totalCount={item.total}
                    lastUpdatedAt={lastUpdatedAt}
                    facilityName={facilityName}
                    testID={`bed-card-${item.category}`}
                  />
                </TouchableOpacity>
              ))
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
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.xs,
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
  contentContainer: {
    padding: Spacing.lg,
  },
  emergencyWarningBox: {
    backgroundColor: Colors.freshness.stale.bg,
    borderWidth: 1,
    borderColor: Colors.freshness.stale.border,
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  emergencyWarningTitle: {
    color: Colors.freshness.stale.text,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
  },
  emergencyWarningText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  emergencyCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  emergencyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emergencyFacilityName: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  metricBox: {
    flex: 1,
    backgroundColor: Colors.surfaceSubtle,
    padding: Spacing.sm,
    borderRadius: Spacing.borderRadius.sm,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
  },
  metricValue: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primary,
    marginTop: 2,
  },
  emergencyStaleContainer: {
    marginTop: Spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
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
});

export default BedAvailabilityScreen;
