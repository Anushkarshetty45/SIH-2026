// Doctor Referral Detail Screen — React Native
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../theme';
import { Button, StatusBadge } from '../../components';

export const ReferralDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const referralId = route.params?.referralId || 'ref-001';

  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Referral #{referralId}</Text>
        <Text style={styles.subtitle}>Detailed clinical notes and patient handover</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.patientName}>Ganesh Chavan (Male, 52)</Text>
            <StatusBadge label={status} variant={status === 'APPROVED' ? 'confirmed' : status === 'REJECTED' ? 'rejected' : 'pending'} />
          </View>
          <Text style={styles.meta}>Referring PHC: PHC Khed • Urgency: HIGH</Text>

          <View style={styles.sectionBox}>
            <Text style={styles.sectionHeading}>Clinical Assessment:</Text>
            <Text style={styles.bodyText}>
              Patient presents with severe acute respiratory infection, fever (102.5°F), oxygen saturation at 89%. Requires immediate high-flow oxygen and ICU bed consideration.
            </Text>
          </View>

          {status === 'PENDING' && (
            <View style={styles.actionRow}>
              <View style={styles.btnCol}>
                <Button title="✓ Approve & Assign Bed" onPress={() => setStatus('APPROVED')} variant="primary" />
              </View>
              <View style={styles.btnCol}>
                <Button title="✕ Reject" onPress={() => setStatus('REJECTED')} variant="danger" />
              </View>
            </View>
          )}
        </View>
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
  card: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Spacing.borderRadius.lg, padding: Spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  patientName: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary },
  meta: { fontSize: Typography.fontSizes.xs, color: Colors.textSecondary, marginBottom: Spacing.md },
  sectionBox: { backgroundColor: Colors.surfaceSubtle, padding: Spacing.md, borderRadius: Spacing.borderRadius.md, marginBottom: Spacing.lg },
  sectionHeading: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  bodyText: { fontSize: Typography.fontSizes.sm, color: Colors.textPrimary, lineHeight: 20 },
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  btnCol: { flex: 1 },
});

export default ReferralDetailScreen;
