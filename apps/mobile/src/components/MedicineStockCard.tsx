// Medicine Stock Level & Controlled Alternatives Card
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';
import { ControlledAlternative, MedicineStock } from '../types';
import { StatusBadge } from './StatusBadge';
import { StaleDataWarning } from './StaleDataWarning';

export interface MedicineStockCardProps {
  stock: MedicineStock;
  alternatives?: ControlledAlternative[];
  testID?: string;
  style?: React.CSSProperties;
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
    <div
      data-testid={testID}
      style={{
        backgroundColor: Colors.surface,
        border: `1px solid ${Colors.border}`,
        borderRadius: Spacing.borderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        ...style,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xs }}>
        <div>
          <h4 style={{ margin: 0, fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary }}>
            💊 {stock.medicine?.name || 'Medicine'}
          </h4>
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary }}>
            {stock.medicine?.genericName} • {stock.medicine?.strength} ({stock.medicine?.dosageForm})
          </span>
        </div>
        <StatusBadge label={getStockLabel()} variant={getStockVariant()} />
      </div>

      <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted, margin: `${Spacing.xs}px 0` }}>
        Reorder Threshold: {stock.reorderLevel} {stock.unit}
        {stock.batchNumber && ` • Batch: ${stock.batchNumber}`}
      </div>

      <StaleDataWarning lastUpdatedAt={stock.lastUpdatedAt} resourceName="inventory" />

      {/* Controlled Alternatives Notice when Out of Stock */}
      {isOutOfStock && alternatives.length > 0 && (
        <div
          style={{
            marginTop: Spacing.md,
            padding: Spacing.sm,
            backgroundColor: Colors.primarySurface,
            borderRadius: Spacing.borderRadius.md,
            border: `1px solid ${Colors.primaryLight}`,
          }}
        >
          <div style={{ fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.bold, color: Colors.primaryDark, marginBottom: Spacing.xs }}>
            🔄 Controlled Alternatives Available ({alternatives.length}):
          </div>
          {alternatives.map((alt) => (
            <div key={alt.id} style={{ fontSize: Typography.fontSizes.xs, color: Colors.textPrimary, padding: '2px 0' }}>
              • <strong>{alt.name}</strong> ({alt.genericName} {alt.strength})
              {alt.isAvailableAtFacility !== undefined && (
                <span style={{ color: alt.isAvailableAtFacility ? Colors.status.available.text : Colors.status.outOfStock.text }}>
                  {' '}- {alt.isAvailableAtFacility ? `Available (${alt.currentStock || 0} ${alt.unit})` : 'Out of Stock'}
                </span>
              )}
            </div>
          ))}
          <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted, marginTop: Spacing.xs, fontStyle: 'italic' }}>
            Note: Controlled alternatives require clinical approval.
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineStockCard;
