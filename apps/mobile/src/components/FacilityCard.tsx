// Facility Overview Card Component — React Native
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme';
import { Facility } from '../types';
import { StaleDataWarning } from './StaleDataWarning';

export interface FacilityCardProps {
  facility: Facility;
  availableBeds?: number;
  totalBeds?: number;
  onPress?: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export const FacilityCard: React.FC<FacilityCardProps> = ({
  facility,
  availableBeds,
  totalBeds,
  onPress,
  testID,
  style,
}) => {
  const ContainerComponent = onPress ? TouchableOpacity : View;

  return (
    <ContainerComponent
      style={[styles.container, style]}
      onPress={onPress}
      testID={testID}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{facility.name}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{facility.type}</Text>
        </View>
      </View>

      <Text style={styles.meta}>
        📍 {facility.district}, {facility.state}
      </Text>

      {totalBeds !== undefined && (
        <View style={styles.bedsRow}>
          <Text style={styles.bedsLabel}>Beds: </Text>
          <Text
            style={[
              styles.bedsValue,
              {
                color:
                  (availableBeds || 0) > 0
                    ? Colors.status.available.text
                    : Colors.status.outOfStock.text,
              },
            ]}
          >
            {availableBeds ?? 0} / {totalBeds} Available
          </Text>
        </View>
      )}

      <StaleDataWarning lastUpdatedAt={facility.lastUpdatedAt} />
    </ContainerComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  name: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  typeBadge: {
    backgroundColor: Colors.primarySurface,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Spacing.borderRadius.sm,
  },
  typeText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.primary,
  },
  meta: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  bedsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  bedsLabel: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  bedsValue: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.medium,
  },
});

export default FacilityCard;
