// Facility Admin Freshness Escalations Screen — React Native
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../theme';
import { Button, StaleDataWarning, StatusBadge } from '../../components';

export const FreshnessEscalationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [escalations, setEscalations] = useState([
    {
      id: 'esc-001',
      resource: 'ICU Bed Availability',
      overdueBy: '45 mins past 2h window',
      tier: 'TIER_1',
      status: 'PENDING_VERIFICATION',
      lastReported: new Date(Date.now() - 165 * 60 * 1000).toISOString(),
    },
    {
      id: 'esc-002',
      resource: 'Emergency Oxygen Cylinders',
      overdueBy: '20 mins past 2h window',
      tier: 'TIER_1',
      status: 'PENDING_VERIFICATION',
      lastReported: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    },
  ]);

  const handleVerify = (id: string) => {
    setEscalations((prev) => prev.filter((e) => e.id !== id));
    Alert.alert('Verification Confirmed', 'Resource freshness verified and reset to CURRENT.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Freshness Escalations (Tier 1)</Text>
        <Text style={styles.subtitle}>Mandatory 2-hour resource verification triggers</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {escalations.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.allGoodText}>✅ All Facility Resources Current</Text>
            <Text style={styles.subGoodText}>No pending Tier-1 verification escalations.</Text>
          </View>
        ) : (
          escalations.map((esc) => (
            <View key={esc.id} style={styles.card}>
              <View style={styles.topRow}>
                <Text style={styles.resourceName}>{esc.resource}</Text>
                <StatusBadge label={esc.tier} variant="timedOut" />
              </View>

              <Text style={styles.overdueText}>⚠️ {esc.overdueBy}</Text>
              <StaleDataWarning lastUpdatedAt={esc.lastReported} resourceName={esc.resource} />

              <View style={styles.btnRow}>
                <Button
                  title="Verify & Attest Counts Now"
                  onPress={() => handleVerify(esc.id)}
                  variant="primary"
                />
              </View>
            </View>
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
  card: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Spacing.borderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  resourceName: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary },
  overdueText: { fontSize: Typography.fontSizes.xs, color: Colors.status.lowStock.text, fontWeight: Typography.fontWeights.semibold, marginBottom: Spacing.xs },
  btnRow: { marginTop: Spacing.md },
  allGoodText: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.status.available.text, textAlign: 'center' },
  subGoodText: { fontSize: Typography.fontSizes.xs, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },
});

export default FreshnessEscalationsScreen;
