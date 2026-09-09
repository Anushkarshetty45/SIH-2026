// District Admin Stale Alerts Screen — React Native
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../theme';
import { StaleDataWarning, StatusBadge } from '../../components';

export const StaleAlertsScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const staleAlerts = [
    {
      id: 'alert-01',
      facilityName: 'Primary Health Centre Narayangaon',
      resource: 'Beds & ICU Data',
      elapsedTime: '150 mins since last update',
      lastUpdatedAt: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
    },
    {
      id: 'alert-02',
      facilityName: 'Sub-District Hospital Baramati',
      resource: 'Emergency Ventilators & Oxygen Stock',
      elapsedTime: '185 mins since last update',
      lastUpdatedAt: new Date(Date.now() - 185 * 60 * 1000).toISOString(),
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
        <Text style={styles.title}>⚠️ Overdue Freshness Alerts</Text>
        <Text style={styles.subtitle}>Facilities exceeding 2-hour SLA without attestation</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {staleAlerts.map((alert) => (
          <View key={alert.id} style={styles.card}>
            <View style={styles.topRow}>
              <Text style={styles.facilityName}>{alert.facilityName}</Text>
              <StatusBadge label="SLA BREACH" variant="rejected" />
            </View>
            <Text style={styles.resource}>{alert.resource}</Text>
            <Text style={styles.elapsed}>Overdue: {alert.elapsedTime}</Text>
            <StaleDataWarning lastUpdatedAt={alert.lastUpdatedAt} resourceName={alert.resource} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.lg, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backButton: { marginBottom: Spacing.xs },
  backText: { color: Colors.primary, fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.medium },
  title: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: Colors.status.lowStock.text },
  subtitle: { fontSize: Typography.fontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  content: { padding: Spacing.lg },
  card: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.freshness.stale.border, borderRadius: Spacing.borderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  facilityName: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary },
  resource: { fontSize: Typography.fontSizes.sm, color: Colors.textPrimary, marginBottom: 2 },
  elapsed: { fontSize: Typography.fontSizes.xs, color: Colors.status.rejected.text, fontWeight: Typography.fontWeights.semibold, marginBottom: Spacing.xs },
});

export default StaleAlertsScreen;
