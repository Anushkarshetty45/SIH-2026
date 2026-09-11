// Bed Category Availability Card Component — React Native
import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography } from '../theme';
import { BedCategory } from '../types';
import { StatusBadge } from './StatusBadge';
import { StaleDataWarning } from './StaleDataWarning';

export interface BedAvailabilityCardProps {
  category: BedCategory;
  availableCount: number;
  totalCount: number;
  lastUpdatedAt: string;
  facilityName?: string;
  isEmergencyContext?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export const BedAvailabilityCard: React.FC<BedAvailabilityCardProps> = ({
  category,
  availableCount,
  totalCount,
  lastUpdatedAt,
  facilityName,
  isEmergencyContext = false,
  testID,
  style,
}) => {
  const isAvailable = availableCount > 0;

  return (
    <View testID={testID} style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>
            {category} Ward
          </Text>
          {facilityName && (
            <Text style={styles.facilityName}>
              {facilityName}
            </Text>
          )}
        </View>
        <StatusBadge
          label={isAvailable ? `${availableCount} Available` : 'Full / 0 Available'}
          variant={isAvailable ? 'available' : 'outOfStock'}
        />
      </View>

      <View style={styles.capacityRow}>
        <Text style={styles.capacityText}>
          Capacity: {totalCount - availableCount} Occupied / {totalCount} Total
        </Text>
      </View>

      <StaleDataWarning
        lastUpdatedAt={lastUpdatedAt}
        resourceName={`${category} beds`}
        isEmergencyMode={isEmergencyContext}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  headerTextContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  facilityName: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: Spacing.xs,
  },
  capacityText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },
});

export default BedAvailabilityCard;
