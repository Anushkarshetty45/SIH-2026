// Doctor Incoming Referrals Screen — React Native
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../theme';
import { ReferralCard, EmptyState } from '../../components';
import { Referral } from '../../types';

export const IncomingReferralsScreen: React.FC = () => {
  const navigation = useNavigation<any>();

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
      patient: { id: 'pat-001', name: 'Ganesh Chavan', preferredLanguage: 'MARATHI', consentStatus: 'GRANTED' },
      fromFacility: { id: 'fac-phc-khed', name: 'PHC Khed', type: 'PHC', status: 'ACTIVE', address: '', district: 'Pune', state: 'MH', pincode: '410501', lastUpdatedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
    },
  ]);

  const handleApprove = (id: string) => {
    setReferrals((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'APPROVED' as const } : r)));
  };

  const handleReject = (id: string) => {
    setReferrals((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'REJECTED' as const } : r)));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Incoming Patient Referrals</Text>
        <Text style={styles.subtitle}>Triage and approval queue (30-minute SLA)</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {referrals.length === 0 ? (
          <EmptyState title="Queue Empty" description="No incoming referrals pending your review." />
        ) : (
          referrals.map((ref) => (
            <ReferralCard
              key={ref.id}
              referral={ref}
              showDoctorActions
              onApprove={() => handleApprove(ref.id)}
              onReject={() => handleReject(ref.id)}
              onPress={() => navigation.navigate('ReferralDetail', { referralId: ref.id })}
            />
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

export default IncomingReferralsScreen;
