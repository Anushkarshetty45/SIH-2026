// Bed Update Screen — Facility Staff / Admin Bed Status Management — React Native
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { bedService } from '../../services/bed.service';
import { Bed, BedStatus } from '../../types';
import { Colors, Spacing, Typography } from '../../theme';
import {
  Button,
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  StaleDataWarning,
  StatusBadge,
} from '../../components';

export interface BedUpdateScreenProps {
  facilityId?: string;
  facilityName?: string;
  onNavigateBack?: () => void;
}

const BED_STATUSES: BedStatus[] = [
  'AVAILABLE',
  'OCCUPIED',
  'RESERVED',
  'MAINTENANCE',
  'UNAVAILABLE',
];

export const BedUpdateScreen: React.FC<BedUpdateScreenProps> = (props) => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const facilityId = props.facilityId || route.params?.facilityId || 'fac-sdh-manchar';
  const facilityName = props.facilityName || route.params?.facilityName || 'Healthcare Facility';
  const onNavigateBack = props.onNavigateBack || (navigation.canGoBack() ? () => navigation.goBack() : undefined);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date().toISOString());
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [targetStatus, setTargetStatus] = useState<BedStatus | null>(null);
  const [updating, setUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchBeds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bedService.listBeds({ facilityId, limit: 100 });
      setBeds(response.data || []);
      setLastUpdatedAt(new Date().toISOString());
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load facility beds');
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    fetchBeds();
  }, [fetchBeds]);

  const handleStatusChangeRequest = (bed: Bed, newStatus: BedStatus) => {
    setSelectedBed(bed);
    setTargetStatus(newStatus);
  };

  const confirmStatusUpdate = async () => {
    if (!selectedBed || !targetStatus) return;
    setUpdating(true);
    try {
      const updated = await bedService.updateBedStatus(selectedBed.id, {
        status: targetStatus,
      });
      setBeds((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      setSelectedBed(null);
      setTargetStatus(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update bed status');
    } finally {
      setUpdating(false);
    }
  };

  const filteredBeds = beds.filter((b) => {
    if (statusFilter === 'ALL') return true;
    return b.status === statusFilter;
  });

  return (
    <View testID="bed-update-screen" style={styles.container}>
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
          <Text style={styles.screenTitle}>Manage Facility Beds</Text>
          <Text style={styles.facilitySubtitle}>
            {facilityName} • Update live occupancy
          </Text>
        </View>

        <Button
          title="Refresh"
          variant="outline"
          onPress={fetchBeds}
          isLoading={loading}
          testID="refresh-button"
        />
      </View>

      {/* Freshness Bar */}
      <View style={styles.freshnessBar}>
        <StaleDataWarning lastUpdatedAt={lastUpdatedAt} resourceName="bed status" />
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'].map((filter) => {
          const isSelected = statusFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              onPress={() => setStatusFilter(filter)}
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
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {loading && <LoadingState message="Loading facility bed roster..." />}

        {error && !loading && (
          <ErrorState title="Bed Update Error" message={error} onRetry={fetchBeds} />
        )}

        {!loading && !error && filteredBeds.length === 0 && (
          <EmptyState
            title="No Beds Found"
            description="No beds match your current status filter."
            actionLabel="View All Beds"
            onAction={() => setStatusFilter('ALL')}
          />
        )}

        {!loading && !error && filteredBeds.length > 0 && (
          <View style={styles.list}>
            {filteredBeds.map((bed) => (
              <View
                key={bed.id}
                testID={`bed-row-${bed.id}`}
                style={styles.bedCard}
              >
                <View style={styles.bedCardTop}>
                  <View>
                    <Text style={styles.bedNumber}>
                      Bed {bed.bedNumber}
                    </Text>
                    <Text style={styles.bedWard}>
                      {bed.ward} ({bed.category})
                    </Text>
                  </View>
                  <StatusBadge
                    label={bed.status}
                    variant={
                      bed.status === 'AVAILABLE'
                        ? 'available'
                        : bed.status === 'OCCUPIED'
                        ? 'confirmed'
                        : 'pending'
                    }
                  />
                </View>

                {/* Status Action Buttons */}
                <View style={styles.statusActionRow}>
                  <Text style={styles.changeLabel}>Change:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {BED_STATUSES.map((st) => (
                      <TouchableOpacity
                        key={st}
                        onPress={() => handleStatusChangeRequest(bed, st)}
                        style={[
                          styles.statusActionButton,
                          bed.status === st && styles.statusActionButtonActive,
                        ]}
                        accessibilityRole="button"
                      >
                        <Text
                          style={[
                            styles.statusActionText,
                            bed.status === st && styles.statusActionTextActive,
                          ]}
                        >
                          {st}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(selectedBed && targetStatus)}
        title="Confirm Bed Status Update"
        message={`Are you sure you want to change Bed ${selectedBed?.bedNumber} (${selectedBed?.ward}) status from ${selectedBed?.status} to ${targetStatus}?`}
        confirmLabel={updating ? 'Updating...' : 'Confirm Update'}
        onConfirm={confirmStatusUpdate}
        onCancel={() => {
          setSelectedBed(null);
          setTargetStatus(null);
        }}
      />
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
  bedCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  bedCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  bedNumber: {
    fontWeight: Typography.fontWeights.bold,
    fontSize: Typography.fontSizes.md,
    color: Colors.textPrimary,
  },
  bedWard: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  changeLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    marginRight: Spacing.xs,
  },
  statusActionButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
    backgroundColor: Colors.surfaceSubtle,
  },
  statusActionButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  statusActionText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeights.medium,
  },
  statusActionTextActive: {
    color: Colors.primary,
    fontWeight: Typography.fontWeights.bold,
  },
});

export default BedUpdateScreen;
