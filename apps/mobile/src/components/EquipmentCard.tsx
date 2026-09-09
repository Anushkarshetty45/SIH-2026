// Medical Equipment Status Card Component — React Native
import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography } from '../theme';
import { Equipment, EquipmentStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { StaleDataWarning } from './StaleDataWarning';

export interface EquipmentCardProps {
  equipment: Equipment;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({
  equipment,
  testID,
  style,
}) => {
  const getStatusVariant = (status: EquipmentStatus) => {
    switch (status) {
      case 'OPERATIONAL':
        return 'available';
      case 'UNDER_MAINTENANCE':
        return 'pending';
      case 'DEFECTIVE':
      case 'UNAVAILABLE':
      default:
        return 'outOfStock';
    }
  };

  return (
    <View testID={testID} style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>
            ⚙️ {equipment.name}
          </Text>
          <Text style={styles.category}>
            {equipment.category}
          </Text>
        </View>
        <StatusBadge
          label={equipment.status.replace('_', ' ')}
          variant={getStatusVariant(equipment.status)}
        />
      </View>

      <Text style={styles.quantity}>
        Units: {equipment.availableQuantity} Available / {equipment.totalQuantity} Total
      </Text>

      <StaleDataWarning
        lastUpdatedAt={equipment.lastUpdatedAt}
        resourceName={equipment.name}
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
  category: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  quantity: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginVertical: Spacing.xs,
  },
});

export default EquipmentCard;
