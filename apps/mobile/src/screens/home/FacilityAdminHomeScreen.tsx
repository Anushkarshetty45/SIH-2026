// Facility Administrator Dashboard Screen — React Native
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../theme';
import { StaleDataWarning } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../i18n';
import { FacilityAdminStackParamList } from '../../navigation/types';

export const FacilityAdminHomeScreen: React.FC = () => {
  const { user, logout, switchLanguage, activeLanguage } = useAuth();
  const navigation = useNavigation<NavigationProp<FacilityAdminStackParamList>>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.roleSubtext}>
            🏥 {t('roles.HOSPITAL_ADMIN')} • Sub-District Hospital Manchar
          </Text>
          <Text style={styles.userName}>
            {user?.name || 'Facility Administrator'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => switchLanguage(activeLanguage === 'mr' ? 'en' : 'mr')}
            style={styles.headerButton}
            accessibilityRole="button"
          >
            <Text style={styles.headerButtonText}>
              {activeLanguage === 'mr' ? 'English' : 'मराठी'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={logout}
            style={styles.headerButton}
            accessibilityRole="button"
          >
            <Text style={styles.headerButtonText}>
              {t('auth.logout')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>
        {/* Bed Capacity Summary */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('BedManagement')}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeading}>
              🛏️ {t('beds.title')} Overview
            </Text>
            <Text style={styles.manageLink}>Manage</Text>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>General Ward</Text>
              <Text style={styles.gridValue}>12 / 20 Available</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>ICU Beds</Text>
              <Text style={[styles.gridValue, { color: Colors.status.available.text }]}>
                2 / 6 Available
              </Text>
            </View>
          </View>
          <StaleDataWarning lastUpdatedAt={new Date(Date.now() - 25 * 60 * 1000).toISOString()} />
        </TouchableOpacity>

        {/* Equipment Status */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('EquipmentManagement')}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeading}>
              ⚙️ Medical Equipment Status
            </Text>
            <Text style={styles.manageLink}>Manage</Text>
          </View>
          <Text style={styles.itemLine}>
            • Ultrasound Scanner: <Text style={styles.bold}>Operational (1/1)</Text>
          </Text>
          <Text style={styles.itemLine}>
            • X-Ray Machine: <Text style={styles.bold}>Operational (1/1)</Text>
          </Text>
          <Text style={[styles.itemLine, { color: Colors.status.lowStock.text }]}>
            • Ventilator Unit #2: <Text style={styles.bold}>Under Maintenance (1 unit)</Text>
          </Text>
        </TouchableOpacity>

        {/* Medicine Stock Alerts */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('MedicineInventory')}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeading}>
              💊 Pharmacy & Stock Alerts
            </Text>
            <Text style={styles.manageLink}>Manage</Text>
          </View>
          <Text style={[styles.alertLine, { color: Colors.status.outOfStock.text }]}>
            ⚠️ Amoxicillin 500mg: OUT OF STOCK (Controlled alternatives mapped)
          </Text>
          <Text style={[styles.alertLine, { color: Colors.status.lowStock.text, marginTop: Spacing.xs }]}>
            ⚠️ Paracetamol 500mg: Low Stock (45 tablets remaining)
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  roleSubtext: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textInverse,
    opacity: 0.9,
  },
  userName: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textInverse,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  headerButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Spacing.borderRadius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  headerButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
  },
  body: {
    padding: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardHeading: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  manageLink: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.primary,
    fontWeight: Typography.fontWeights.semibold,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  gridItem: {
    flex: 1,
    padding: Spacing.sm,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Spacing.borderRadius.md,
  },
  gridLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },
  gridValue: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  itemLine: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textPrimary,
    marginVertical: 2,
  },
  alertLine: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
  },
  bold: {
    fontWeight: Typography.fontWeights.bold,
  },
});

export default FacilityAdminHomeScreen;
