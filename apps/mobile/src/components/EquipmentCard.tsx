// Medical Equipment Status Card Component
import React from 'react';
import { Colors, Spacing, Typography } from '../theme';
import { Equipment, EquipmentStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { StaleDataWarning } from './StaleDataWarning';

export interface EquipmentCardProps {
  equipment: Equipment;
  testID?: string;
  style?: React.CSSProperties;
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
    <div
      data-testid={testID}
      style={{
        backgroundColor: Colors.surface,
        border: `1px solid ${Colors.border}`,
        borderRadius: Spacing.borderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        ...style,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs }}>
        <div>
          <h4 style={{ margin: 0, fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary }}>
            ⚙️ {equipment.name}
          </h4>
          <span style={{ fontSize: Typography.fontSizes.xs, color: Colors.textMuted }}>
            {equipment.category}
          </span>
        </div>
        <StatusBadge
          label={equipment.status.replace('_', ' ')}
          variant={getStatusVariant(equipment.status)}
        />
      </div>

      <div style={{ fontSize: Typography.fontSizes.xs, color: Colors.textSecondary, marginTop: Spacing.xs, marginBottom: Spacing.xs }}>
        Units: {equipment.availableQuantity} Available / {equipment.totalQuantity} Total
      </div>

      <StaleDataWarning lastUpdatedAt={equipment.lastUpdatedAt} resourceName={equipment.name} />
    </div>
  );
};

export default EquipmentCard;
