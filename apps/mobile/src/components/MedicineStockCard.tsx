// Medicine Stock Level & Controlled Alternatives Card — React Native
import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography } from '../theme';
import { ControlledAlternative, MedicineStock } from '../types';
import { StatusBadge } from './StatusBadge';
import { StaleDataWarning } from './StaleDataWarning';

export interface MedicineStockCardProps {
  stock: MedicineStock;
  alternatives?: ControlledAlternative[];
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export const MedicineStockCard: React.FC<MedicineStockCardProps> = ({
  stock,
  alternatives = [],
  testID,
  style,
}) => {
  const isOutOfStock = stock.currentStock <= 0;
  const isLowStock = stock.currentStock > 0 && stock.currentStock <= stock.reorderLevel;

  const getStockVariant = () => {
    if (isOutOfStock) return 'outOfStock';
    if (isLowStock) return 'lowStock';
    return 'available';
  };

  const getStockLabel = () => {
    if (isOutOfStock) return 'Out of Stock';
    if (isLowStock) return `Low Stock (${stock.currentStock} ${stock.unit})`;
    return `In Stock (${stock.currentStock} ${stock.unit})`;
  };

  return (
    <View testID={testID} style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>
            💊 {stock.medicine?.name || 'Medicine'}
          </Text>
          <Text style={styles.subtitle}>
            {stock.medicine?.genericName} • {stock.medicine?.strength} ({stock.medicine?.dosageForm})
          </Text>
        </View>
        <StatusBadge label={getStockLabel()} variant={getStockVariant()} />
      </View>

      <Text style={styles.reorderText}>
        Reorder Threshold: {stock.reorderLevel} {stock.unit}
        {stock.batchNumber ? ` • Batch: ${stock.batchNumber}` : ''}
      </Text>

      <StaleDataWarning lastUpdatedAt={stock.lastUpdatedAt} resourceName="inventory" />

      {/* Controlled Alternatives Notice when Out of Stock */}
      {isOutOfStock && alternatives.length > 0 && (
        <View style={styles.alternativesBox}>
          <Text style={styles.alternativesTitle}>
            🔄 Controlled Alternatives Available ({alternatives.length}):
          </Text>
          {alternatives.map((alt) => (
            <View key={alt.id} style={styles.altRow}>
              <Text style={styles.altText}>
                • <Text style={styles.altBold}>{alt.name}</Text> ({alt.genericName} {alt.strength})
                {alt.isAvailableAtFacility !== undefined && (
                  <Text
                    style={{
                      color: alt.isAvailableAtFacility
                        ? Colors.status.available.text
                        : Colors.status.outOfStock.text,
                    }}
                  >
                    {' '}- {alt.isAvailableAtFacility ? `Available (${alt.currentStock || 0} ${alt.unit})` : 'Out of Stock'}
                  </Text>
                )}
              </Text>
            </View>
          ))}
          <Text style={styles.alternativesNote}>
            Note: Controlled alternatives require clinical approval.
          </Text>
        </View>
      )}
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
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  headerTextContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  reorderText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    marginVertical: Spacing.xs,
  },
  alternativesBox: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.primarySurface,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  alternativesTitle: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primaryDark,
    marginBottom: Spacing.xs,
  },
  altRow: {
    paddingVertical: 2,
  },
  altText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textPrimary,
  },
  altBold: {
    fontWeight: Typography.fontWeights.bold,
  },
  alternativesNote: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
});

export default MedicineStockCard;
