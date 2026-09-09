// District Health Authority Overview Screen — React Native
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
import { DistrictAdminStackParamList } from '../../navigation/types';

export const DistrictAdminHomeScreen: React.FC = () => {
  const { user, logout, switchLanguage, activeLanguage } = useAuth();
  const navigation = useNavigation<NavigationProp<DistrictAdminStackParamList>>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.roleSubtext}>
            🏛️ {t('roles.SUPER_ADMIN')} • District Health Authority, Pune
          </Text>
          <Text style={styles.userName}>
            {user?.name || 'District Officer'}
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
        {/* District High-level Overview Cards */}
        <View style={styles.overviewGrid}>
          <TouchableOpacity
            style={styles.overviewCard}
            onPress={() => navigation.navigate('FacilitiesList')}
            activeOpacity={0.8}
          >
            <Text style={styles.overviewLabel}>Facilities Monitored</Text>
            <Text style={styles.overviewValuePrimary}>14</Text>
          </TouchableOpacity>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>Active Referrals</Text>
            <Text style={styles.overviewValueSuccess}>28</Text>
          </View>
        </View>

        {/* Operational Freshness Alerts (> 2h without update) */}
        <TouchableOpacity
          style={styles.alertsCard}
          onPress={() => navigation.navigate('StaleAlerts')}
          activeOpacity={0.8}
        >
          <View style={styles.alertsHeaderRow}>
            <Text style={styles.alertsHeading}>
              ⚠️ Overdue Freshness Updates (Tier 2 Escalations)
            </Text>
            <Text style={styles.viewLink}>View</Text>
          </View>
          <Text style={styles.alertsDescription}>
            The following facilities have not submitted resource verification within the 2-hour window:
          </Text>

          <View style={styles.divider}>
            <Text style={styles.facilityName}>
              • PHC Narayangaon
            </Text>
            <StaleDataWarning
              lastUpdatedAt={new Date(Date.now() - 145 * 60 * 1000).toISOString()}
              resourceName="bed data"
            />
          </View>
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
  overviewGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  overviewCard: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  overviewLabel: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
  },
  overviewValuePrimary: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.primary,
    marginTop: 4,
  },
  overviewValueSuccess: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.status.available.text,
    marginTop: 4,
  },
  alertsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  alertsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  alertsHeading: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.status.lowStock.text,
    flex: 1,
    marginRight: Spacing.xs,
  },
  viewLink: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.primary,
    fontWeight: Typography.fontWeights.semibold,
  },
  alertsDescription: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  facilityName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
});

export default DistrictAdminHomeScreen;
