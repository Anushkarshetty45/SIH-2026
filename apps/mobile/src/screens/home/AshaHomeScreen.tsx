// ASHA Worker / PHC Staff Home Screen — React Native
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
import { Button, StatusBadge, StaleDataWarning, OfflineBanner, SyncStatus } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { t } from '../../i18n';
import { AshaStackParamList } from '../../navigation/types';

export const AshaHomeScreen: React.FC = () => {
  const { user, logout, switchLanguage, activeLanguage } = useAuth();
  const { networkStatus, pendingCount, lastSyncedText, triggerSync } = useOffline();
  const navigation = useNavigation<NavigationProp<AshaStackParamList>>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <OfflineBanner
        status={networkStatus}
        lastSyncedText={lastSyncedText}
        onRetrySync={triggerSync}
      />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.roleSubtext}>
            {t('roles.ASHA_WORKER')} • PHC Khed
          </Text>
          <Text style={styles.userName}>
            {user?.name || 'ASHA Worker'}
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
        <View style={styles.syncRow}>
          <SyncStatus
            status={networkStatus}
            pendingCount={pendingCount}
            lastSyncedText={lastSyncedText}
          />
        </View>

        {/* Primary Action Button */}
        <View style={styles.actionButtonContainer}>
          <Button
            title={`+ ${t('referrals.create')}`}
            onPress={() => navigation.navigate('CreateReferral', {})}
            variant="primary"
          />
        </View>

        {/* Section 1: Pending Referrals */}
        <TouchableOpacity
          style={styles.sectionCard}
          onPress={() => navigation.navigate('ReferralList')}
          activeOpacity={0.8}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              📋 {t('referrals.title')}
            </Text>
            <Text style={styles.badgeText}>
              2 Active
            </Text>
          </View>

          <View style={styles.divider}>
            <View style={styles.referralRow}>
              <View>
                <Text style={styles.patientName}>Sunita Patil</Text>
                <Text style={styles.destinationText}>➔ Sub-District Hospital Manchar</Text>
              </View>
              <StatusBadge label={t('referrals.statusPending')} variant="pending" />
            </View>
            <Text style={styles.timeoutNotice}>
              ⏱ {t('referrals.timeoutNotice')}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Section 2: Today's Appointments */}
        <TouchableOpacity
          style={styles.sectionCard}
          onPress={() => navigation.navigate('BookAppointment', {})}
          activeOpacity={0.8}
        >
          <Text style={[styles.sectionTitle, { marginBottom: Spacing.sm }]}>
            📅 {t('appointments.title')}
          </Text>
          <View style={styles.divider}>
            <View style={styles.referralRow}>
              <View>
                <Text style={styles.patientName}>Ramesh Shinde</Text>
                <Text style={styles.destinationText}>Dr. Deshmukh • 11:30 AM</Text>
              </View>
              <StatusBadge label={t('appointments.statusConfirmed')} variant="confirmed" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Section 3: Nearby Facility Bed Availability with Stale Warning */}
        <TouchableOpacity
          style={styles.sectionCard}
          onPress={() => navigation.navigate('FacilityAvailability', {})}
          activeOpacity={0.8}
        >
          <Text style={[styles.sectionTitle, { marginBottom: Spacing.sm }]}>
            🏥 {t('beds.title')} (Nearby Facilities)
          </Text>
          <View style={styles.divider}>
            <View style={[styles.referralRow, { marginBottom: Spacing.xs }]}>
              <Text style={styles.facilityTitle}>
                Sub-District Hospital Manchar
              </Text>
              <StatusBadge label="4 ICU Beds" variant="available" />
            </View>
            <StaleDataWarning lastUpdatedAt={new Date(Date.now() - 35 * 60 * 1000).toISOString()} />
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
    backgroundColor: Colors.primary,
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
    alignItems: 'center',
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
  syncRow: {
    marginBottom: Spacing.md,
  },
  actionButtonContainer: {
    marginBottom: Spacing.lg,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  badgeText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.primary,
    fontWeight: Typography.fontWeights.semibold,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  referralRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  destinationText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  timeoutNotice: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.status.timedOut.text,
    marginTop: Spacing.xs,
  },
  facilityTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.textPrimary,
  },
});

export default AshaHomeScreen;
