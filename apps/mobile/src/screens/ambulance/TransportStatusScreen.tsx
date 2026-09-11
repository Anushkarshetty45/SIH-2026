// Ambulance Transport Status Screen — React Native
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../theme';
import { Button, StatusBadge } from '../../components';
import { TransportStatus } from '../../types';

export const TransportStatusScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const transportId = route.params?.transportId || 'run-108';

  const [status, setStatus] = useState<TransportStatus>('EN_ROUTE');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Transport #{transportId}</Text>
        <Text style={styles.subtitle}>Manage active emergency patient transfer leg</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.patient}>Patient: Cardiac Emergency (Age 58)</Text>
            <StatusBadge label={status} variant={status === 'COMPLETED' ? 'confirmed' : 'pending'} />
          </View>
          <Text style={styles.routeText}>Route: PHC Khed ➔ District Hospital Aundh</Text>

          <View style={styles.btnRow}>
            {status === 'EN_ROUTE' && (
              <Button title="Mark Arrived at Facility" onPress={() => setStatus('ARRIVED')} variant="primary" />
            )}
            {status === 'ARRIVED' && (
              <Button title="Complete Emergency Transport" onPress={() => setStatus('COMPLETED')} variant="secondary" />
            )}
            {status === 'COMPLETED' && (
              <Button title="Transport Complete ✓" onPress={() => navigation.goBack()} variant="outline" />
            )}
          </View>
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
  patient: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary },
  routeText: { fontSize: Typography.fontSizes.xs, color: Colors.textSecondary, marginBottom: Spacing.lg },
  btnRow: { marginTop: Spacing.md },
});

export default TransportStatusScreen;
