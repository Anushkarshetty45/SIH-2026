// ASHA Referral List Screen — React Native
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../theme';
import { ReferralCard, EmptyState } from '../../components';
import { Referral } from '../../types';

export const ReferralListScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const demoReferrals: Referral[] = [
    {
      id: 'ref-001',
      patientId: 'pat-001',
      createdById: 'user-asha-1',
      fromFacilityId: 'fac-phc-khed',
      toFacilityId: 'fac-sdh-manchar',
      status: 'PENDING_DOCTOR_APPROVAL',
      urgency: 'HIGH',
      clinicalNotes: 'Persistent fever and respiratory distress.',
      timeoutAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      patient: { id: 'pat-001', name: 'Sunita Patil', preferredLanguage: 'MARATHI', consentStatus: 'GRANTED' },
      fromFacility: { id: 'fac-phc-khed', name: 'PHC Khed', type: 'PHC', status: 'ACTIVE', address: '', district: 'Pune', state: 'MH', pincode: '410501', lastUpdatedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
      toFacility: { id: 'fac-sdh-manchar', name: 'Sub-District Hospital Manchar', type: 'CHC', status: 'ACTIVE', address: '', district: 'Pune', state: 'MH', pincode: '410503', lastUpdatedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
    },
    {
      id: 'ref-002',
      patientId: 'pat-002',
      createdById: 'user-asha-1',
      fromFacilityId: 'fac-phc-khed',
      toFacilityId: 'fac-sdh-manchar',
      status: 'APPROVED',
      urgency: 'NORMAL',
      clinicalNotes: 'Antenatal care 3rd trimester follow-up check.',
      timeoutAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      patient: { id: 'pat-002', name: 'Pooja Jadhav', preferredLanguage: 'MARATHI', consentStatus: 'GRANTED' },
      fromFacility: { id: 'fac-phc-khed', name: 'PHC Khed', type: 'PHC', status: 'ACTIVE', address: '', district: 'Pune', state: 'MH', pincode: '410501', lastUpdatedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
      toFacility: { id: 'fac-sdh-manchar', name: 'Sub-District Hospital Manchar', type: 'CHC', status: 'ACTIVE', address: '', district: 'Pune', state: 'MH', pincode: '410503', lastUpdatedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>ASHA Referrals</Text>
        <Text style={styles.subtitle}>Active and pending patient transfers</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {demoReferrals.length === 0 ? (
          <EmptyState title="No Referrals" description="No active referrals registered." />
        ) : (
          demoReferrals.map((ref) => (
            <ReferralCard key={ref.id} referral={ref} />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.lg, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backButton: { marginBottom: Spacing.xs },
  backText: { color: Colors.primary, fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.medium },
  title: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.fontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  content: { padding: Spacing.lg },
});

export default ReferralListScreen;
