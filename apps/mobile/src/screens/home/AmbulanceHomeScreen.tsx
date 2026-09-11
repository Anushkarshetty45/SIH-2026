// Ambulance Staff Emergency Operations Screen — React Native
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
import { Button, StatusBadge, StaleDataWarning } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../i18n';
import { TransportStatus } from '../../types';
import { AmbulanceStackParamList } from '../../navigation/types';

export const AmbulanceHomeScreen: React.FC = () => {
  const { user, logout, switchLanguage, activeLanguage } = useAuth();
  const [transportStatus, setTransportStatus] = useState<TransportStatus>('EN_ROUTE');
  const navigation = useNavigation<NavigationProp<AmbulanceStackParamList>>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Emergency Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.roleSubtext}>
            🚑 {t('roles.AMBULANCE_STAFF')} • MH-14-AZ-1080
          </Text>
          <Text style={styles.userName}>
            {user?.name || 'Ambulance Operator'}
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
        {/* Active Emergency Transport Status Card */}
        <TouchableOpacity
          style={styles.emergencyCard}
          onPress={() => navigation.navigate('TransportStatus', { transportId: 'run-108' })}
          activeOpacity={0.9}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              🚨 Active Emergency Run
            </Text>
            <StatusBadge
              label={transportStatus}
              variant={transportStatus === 'COMPLETED' ? 'confirmed' : 'pending'}
            />
          </View>

          <Text style={styles.patientInfo}>
            <Text style={styles.bold}>Patient:</Text> Critical Cardiac Emergency (Age 58)
          </Text>
          <Text style={styles.destinationInfo}>
            <Text style={styles.bold}>Destination:</Text> District Hospital Aundh (ETA ~18 mins)
          </Text>

          <View style={styles.buttonRow}>
            {transportStatus === 'EN_ROUTE' && (
              <Button
                title="Mark Arrived at Facility"
                onPress={() => setTransportStatus('ARRIVED')}
                variant="primary"
              />
            )}
            {transportStatus === 'ARRIVED' && (
              <Button
                title="Complete Emergency Transport"
                onPress={() => setTransportStatus('COMPLETED')}
                variant="secondary"
              />
            )}
          </View>
        </TouchableOpacity>

        {/* Nearest Facilities with ICU / Oxygen Beds */}
        <View style={styles.nearestHeaderRow}>
          <Text style={styles.sectionTitle}>
            🏥 Nearest Emergency Receiving Facilities
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('NearbyFacilities')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.facilityCard}>
          <View style={styles.facilityHeader}>
            <Text style={styles.facilityName}>
              District Hospital Aundh
            </Text>
            <Text style={styles.distanceBadge}>
              6.2 km
            </Text>
          </View>
          <Text style={styles.bedCounts}>
            ICU Beds: <Text style={styles.bold}>3 Available</Text> • Ventilator: <Text style={styles.bold}>1 Available</Text>
          </Text>
          <StaleDataWarning
            lastUpdatedAt={new Date(Date.now() - 15 * 60 * 1000).toISOString()}
            isEmergencyMode
          />
        </View>

        <View style={styles.facilityCard}>
          <View style={styles.facilityHeader}>
            <Text style={styles.facilityName}>
              Sub-District Hospital Manchar
            </Text>
            <Text style={styles.distanceBadge}>
              14.5 km
            </Text>
          </View>
          <Text style={styles.bedCounts}>
            ICU Beds: <Text style={styles.bold}>0 Available (Full)</Text> • Oxygen: <Text style={styles.bold}>4 Available</Text>
          </Text>
          <StaleDataWarning
            lastUpdatedAt={new Date(Date.now() - 135 * 60 * 1000).toISOString()}
            isEmergencyMode
          />
        </View>
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
    backgroundColor: Colors.emergency.surface,
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
  emergencyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.emergency.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.emergency.surface,
  },
  patientInfo: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  destinationInfo: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  bold: {
    fontWeight: Typography.fontWeights.bold,
  },
  buttonRow: {
    marginTop: Spacing.xs,
  },
  nearestHeaderRow: {
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
  viewAllText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.primary,
    fontWeight: Typography.fontWeights.semibold,
  },
  facilityCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  facilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  facilityName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
  },
  distanceBadge: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.primary,
  },
  bedCounts: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textPrimary,
    marginVertical: Spacing.xs,
  },
});

export default AmbulanceHomeScreen;
