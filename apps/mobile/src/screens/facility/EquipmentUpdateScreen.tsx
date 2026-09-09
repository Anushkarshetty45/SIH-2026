// Equipment Update Screen — Facility Equipment Quantities and Operational Status — React Native
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { equipmentService } from '../../services/equipment.service';
import { Equipment, EquipmentStatus } from '../../types';
import { Colors, Spacing, Typography } from '../../theme';
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  StaleDataWarning,
  StatusBadge,
  TextInput,
} from '../../components';

export interface EquipmentUpdateScreenProps {
  facilityId?: string;
  facilityName?: string;
  onNavigateBack?: () => void;
}

const EQUIPMENT_STATUSES: EquipmentStatus[] = [
  'OPERATIONAL',
  'UNDER_MAINTENANCE',
  'DEFECTIVE',
  'UNAVAILABLE',
];

export const EquipmentUpdateScreen: React.FC<EquipmentUpdateScreenProps> = (props) => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const facilityId = props.facilityId || route.params?.facilityId || 'fac-sdh-manchar';
  const facilityName = props.facilityName || route.params?.facilityName || 'Healthcare Facility';
  const onNavigateBack = props.onNavigateBack || (navigation.canGoBack() ? () => navigation.goBack() : undefined);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date().toISOString());
  const [selectedEquip, setSelectedEquip] = useState<Equipment | null>(null);
  const [editAvailableQty, setEditAvailableQty] = useState<string>('0');
  const [editTotalQty, setEditTotalQty] = useState<string>('0');
  const [editStatus, setEditStatus] = useState<EquipmentStatus>('OPERATIONAL');
  const [updating, setUpdating] = useState(false);

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await equipmentService.getFacilityEquipment(facilityId);
      setEquipmentList(data.equipment || []);
      setLastUpdatedAt(data.lastUpdatedAt || new Date().toISOString());
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load equipment');
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const handleOpenEdit = (item: Equipment) => {
    setSelectedEquip(item);
    setEditAvailableQty(String(item.availableQuantity));
    setEditTotalQty(String(item.totalQuantity));
    setEditStatus(item.status);
  };

  const handleSaveUpdate = async () => {
    if (!selectedEquip) return;
    setUpdating(true);
    try {
      const updated = await equipmentService.updateEquipment(selectedEquip.id, {
        availableQuantity: parseInt(editAvailableQty, 10) || 0,
        totalQuantity: parseInt(editTotalQty, 10) || 0,
        status: editStatus,
      });
      setEquipmentList((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setSelectedEquip(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update equipment');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View testID="equipment-update-screen" style={styles.container}>
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
          <Text style={styles.screenTitle}>Manage Equipment</Text>
          <Text style={styles.facilitySubtitle}>
            {facilityName} • Update functional counts and status
          </Text>
        </View>

        <Button
          title="Refresh"
          variant="outline"
          onPress={fetchEquipment}
          isLoading={loading}
          testID="refresh-button"
        />
      </View>

      {/* Freshness Bar */}
      <View style={styles.freshnessBar}>
        <StaleDataWarning lastUpdatedAt={lastUpdatedAt} resourceName="equipment records" />
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {loading && <LoadingState message="Loading facility equipment list..." />}

        {error && !loading && (
          <ErrorState title="Equipment Update Error" message={error} onRetry={fetchEquipment} />
        )}

        {!loading && !error && equipmentList.length === 0 && (
          <EmptyState
            title="No Equipment Registered"
            description="No medical equipment records found for this facility."
          />
        )}

        {!loading && !error && equipmentList.length > 0 && (
          <View style={styles.list}>
            {equipmentList.map((item) => (
              <View
                key={item.id}
                testID={`equipment-row-${item.id}`}
                style={styles.equipmentCard}
              >
                <View style={styles.equipmentInfo}>
                  <Text style={styles.equipmentName}>
                    {item.name}
                  </Text>
                  <Text style={styles.equipmentMeta}>
                    Category: {item.category} • Available: {item.availableQuantity} / {item.totalQuantity}
                  </Text>
                  <View style={styles.badgeWrapper}>
                    <StatusBadge
                      label={item.status}
                      variant={item.status === 'OPERATIONAL' ? 'available' : 'lowStock'}
                    />
                  </View>
                </View>

                <Button
                  title="Edit Status / Qty"
                  variant="outline"
                  onPress={() => handleOpenEdit(item)}
                  testID={`edit-equip-${item.id}`}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Edit Modal Dialog */}
      {selectedEquip && (
        <Modal
          visible={Boolean(selectedEquip)}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedEquip(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Update {selectedEquip.name}
              </Text>

              <Text style={styles.label}>Operational Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusRow}>
                {EQUIPMENT_STATUSES.map((st) => (
                  <TouchableOpacity
                    key={st}
                    onPress={() => setEditStatus(st)}
                    style={[
                      styles.statusPill,
                      editStatus === st && styles.statusPillActive,
                    ]}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        editStatus === st && styles.statusPillTextActive,
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.inputsRow}>
                <View style={styles.inputCol}>
                  <TextInput
                    label="Available Units"
                    value={editAvailableQty}
                    onChangeText={setEditAvailableQty}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputCol}>
                  <TextInput
                    label="Total Units"
                    value={editTotalQty}
                    onChangeText={setEditTotalQty}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.modalButtonsRow}>
                <View style={styles.modalButton}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={() => setSelectedEquip(null)}
                  />
                </View>
                <View style={styles.modalButton}>
                  <Button
                    title="Save Changes"
                    onPress={handleSaveUpdate}
                    isLoading={updating}
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  contentContainer: {
    padding: Spacing.lg,
  },
  list: {
    flexDirection: 'column',
    gap: Spacing.sm,
  },
  equipmentCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  equipmentInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  equipmentName: {
    fontWeight: Typography.fontWeights.bold,
    fontSize: Typography.fontSizes.md,
    color: Colors.textPrimary,
  },
  equipmentMeta: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgeWrapper: {
    marginTop: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  statusPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSubtle,
    marginRight: 6,
  },
  statusPillActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  statusPillText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  statusPillTextActive: {
    color: Colors.primary,
    fontWeight: Typography.fontWeights.bold,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  inputCol: {
    flex: 1,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
    marginTop: Spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
});

export default EquipmentUpdateScreen;
