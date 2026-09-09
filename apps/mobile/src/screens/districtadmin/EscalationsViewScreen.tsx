// District Admin Escalations View Screen — React Native
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../theme';
import { StatusBadge } from '../../components';

export const EscalationsViewScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const escalations = [
    {
      id: 'tier2-001',
      facility: 'PHC Narayangaon',
      issue: 'Zero verification submissions for > 4 hours',
      actionRequired: 'Automated notification sent to District CMO',
      severity: 'TIER_2',
    },
    {
      id: 'tier2-002',
      facility: 'SDH Baramati',
      issue: 'Out of Stock critical antivenom unverified > 3 hours',
      actionRequired: 'Emergency buffer stock dispatch requested from Central Warehouse',
      severity: 'TIER_2',
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
        <Text style={styles.title}>Tier 2 Administrative Escalations</Text>
        <Text style={styles.subtitle}>Supervisory alerts requiring district health officer intervention</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {escalations.map((esc) => (
          <View key={esc.id} style={styles.card}>
            <View style={styles.topRow}>
              <Text style={styles.facility}>{esc.facility}</Text>
              <StatusBadge label={esc.severity} variant="timedOut" />
            </View>
            <Text style={styles.issue}>⚠️ {esc.issue}</Text>
            <View style={styles.actionBox}>
              <Text style={styles.actionText}>Action: {esc.actionRequired}</Text>
            </View>
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
  title: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.fontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  content: { padding: Spacing.lg },
  card: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Spacing.borderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  facility: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary },
  issue: { fontSize: Typography.fontSizes.sm, color: Colors.textPrimary, marginVertical: Spacing.xs },
  actionBox: { backgroundColor: Colors.surfaceSubtle, padding: Spacing.sm, borderRadius: Spacing.borderRadius.sm, marginTop: Spacing.xs },
  actionText: { fontSize: Typography.fontSizes.xs, color: Colors.primary, fontWeight: Typography.fontWeights.medium },
});

export default EscalationsViewScreen;
