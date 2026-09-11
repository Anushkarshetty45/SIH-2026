// Ambulance Emergency Mode Screen — React Native
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../theme';
import { Button, StaleDataWarning } from '../../components';

export const EmergencyModeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [pulse, setPulse] = useState('110 bpm');
  const [spo2, setSpo2] = useState('88%');
  const [bp, setBp] = useState('140/90 mmHg');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>🚨 ACTIVE EMERGENCY MODE</Text>
        <Text style={styles.subtitle}>En-route vital telemetry & priority hospital routing</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.heading}>In-Transit Vitals Telemetry</Text>
          <View style={styles.grid}>
            <View style={styles.metric}>
              <Text style={styles.label}>Pulse</Text>
              <Text style={styles.val}>{pulse}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.label}>SpO2</Text>
              <Text style={[styles.val, { color: Colors.emergency.surface }]}>{spo2}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.label}>BP</Text>
              <Text style={styles.val}>{bp}</Text>
            </View>
          </View>

          <StaleDataWarning
            lastUpdatedAt={new Date().toISOString()}
            isEmergencyMode
            resourceName="telemetry"
          />

          <View style={styles.btnRow}>
            <Button
              title="View Nearby Facilities With Available ICU Beds"
              onPress={() => navigation.navigate('NearbyFacilities')}
              variant="danger"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.lg, backgroundColor: Colors.emergency.surface, borderBottomWidth: 1, borderBottomColor: Colors.emergency.border },
  backButton: { marginBottom: Spacing.xs },
  backText: { color: Colors.textInverse, fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.medium },
  title: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: Colors.textInverse },
  subtitle: { fontSize: Typography.fontSizes.xs, color: Colors.textInverse, opacity: 0.9, marginTop: 2 },
  content: { padding: Spacing.lg },
  card: { backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.emergency.border, borderRadius: Spacing.borderRadius.lg, padding: Spacing.lg },
  heading: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.emergency.surface, marginBottom: Spacing.md },
  grid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  metric: { flex: 1, backgroundColor: Colors.surfaceSubtle, padding: Spacing.sm, borderRadius: Spacing.borderRadius.sm, alignItems: 'center' },
  label: { fontSize: Typography.fontSizes.xs, color: Colors.textSecondary },
  val: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary, marginTop: 2 },
  btnRow: { marginTop: Spacing.lg },
});

export default EmergencyModeScreen;
