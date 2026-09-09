// Doctor Home & Clinical Coordination Dashboard Screen — React Native
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../theme';
import { ReferralCard, StaleDataWarning } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../i18n';
import { Referral } from '../../types';
import { DoctorStackParamList } from '../../navigation/types';

export const DoctorHomeScreen: React.FC = () => {
  const { user, logout, switchLanguage, activeLanguage } = useAuth();
  const navigation = useNavigation<NavigationProp<DoctorStackParamList>>();

  // Demo incoming referral state
  const [referrals, setReferrals] = useState<Referral[]>([
    {
      id: 'ref-001',
      patientId: 'pat-001',
      createdById: 'user-asha-1',
      fromFacilityId: 'fac-phc-khed',
      toFacilityId: 'fac-sdh-manchar',
      status: 'PENDING_DOCTOR_APPROVAL',
      urgency: 'HIGH',
      clinicalNotes: 'Persistent high fever, severe breathlessness for 3 days.',
      timeoutAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      patient: {
        id: 'pat-001',
        name: 'Ganesh Chavan',
        preferredLanguage: 'MARATHI',
        consentStatus: 'GRANTED',
      },
      fromFacility: {
        id: 'fac-phc-khed',
        name: 'PHC Khed',
        type: 'PHC',
        status: 'ACTIVE',
        address: 'Khed, Pune',
        district: 'Pune',
        state: 'Maharashtra',
        pincode: '410501',
        lastUpdatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    },
  ]);

  const handleApprove = (id: string) => {
    setReferrals((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'APPROVED' as const } : r))
    );
  };

  const handleReject = (id: string) => {
    setReferrals((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'REJECTED' as const } : r))
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.roleSubtext}>
            👨‍⚕️ {t('roles.DOCTOR')} • General Medicine
          </Text>
          <Text style={styles.userName}>
            Dr. {user?.name || 'Clinician'}
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
        {/* Section: Incoming Referrals */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>
              📥 {t('referrals.title')} ({referrals.filter((r) => r.status === 'PENDING_DOCTOR_APPROVAL').length} Pending)
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('IncomingReferrals')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {referrals.map((referral) => (
            <ReferralCard
              key={referral.id}
              referral={referral}
              showDoctorActions
              onApprove={() => handleApprove(referral.id)}
              onReject={() => handleReject(referral.id)}
              onPress={() => navigation.navigate('ReferralDetail', { referralId: referral.id })}
            />
          ))}
        </View>

        {/* Section: Today's Schedule */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('DoctorAppointments')}
          activeOpacity={0.8}
        >
          <Text style={[styles.sectionHeading, { marginBottom: Spacing.sm }]}>
            📅 {t('appointments.title')} (Today's OPD)
          </Text>
          <Text style={styles.scheduleText}>
            • 10:00 AM — Ramesh Shinde (Follow-up)
          </Text>
          <Text style={[styles.scheduleText, { marginTop: Spacing.xs }]}>
            • 11:30 AM — Anusaya Gaikwad (OPD Consultation)
          </Text>
        </TouchableOpacity>

        {/* Section: Bed Availability Quick Status */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('FacilityBeds')}
          activeOpacity={0.8}
        >
          <Text style={[styles.sectionHeading, { marginBottom: Spacing.sm }]}>
            🏥 Hospital Ward Capacity
          </Text>
          <View style={styles.capacityRow}>
            <Text style={styles.capacityItem}>
              ICU: <Text style={styles.boldText}>2 Available</Text>
            </Text>
            <Text style={styles.capacityItem}>
              Oxygen: <Text style={styles.boldText}>5 Available</Text>
            </Text>
            <Text style={styles.capacityItem}>
              General: <Text style={styles.boldText}>14 Available</Text>
            </Text>
          </View>
          <StaleDataWarning lastUpdatedAt={new Date(Date.now() - 42 * 60 * 1000).toISOString()} />
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
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionHeading: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  viewAllText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.primary,
    fontWeight: Typography.fontWeights.semibold,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  scheduleText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
  },
  capacityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  capacityItem: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textPrimary,
  },
  boldText: {
    fontWeight: Typography.fontWeights.bold,
  },
});

export default DoctorHomeScreen;
