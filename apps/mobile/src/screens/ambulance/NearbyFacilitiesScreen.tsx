// Ambulance Nearby Facilities Screen — React Native
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../theme';
import { StaleDataWarning, StatusBadge } from '../../components';

export const NearbyFacilitiesScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const facilities = [
    {
      id: 'fac-001',
      name: 'District Hospital Aundh',
      distance: '6.2 km',
      icuBeds: '3 Available',
      ventilators: '1 Available',
      lastUpdated: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 'fac-002',
      name: 'Sub-District Hospital Manchar',
      distance: '14.5 km',
      icuBeds: '0 Available (Full)',
      ventilators: '0 Available',
      lastUpdated: new Date(Date.now() - 135 * 60 * 1000).toISOString(),
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
        <Text style={styles.title}>Emergency Facilities (Radius: 25km)</Text>
        <Text style={styles.subtitle}>Ranked by distance and ICU / critical care capacity</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {facilities.map((fac) => (
          <View key={fac.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.facName}>{fac.name}</Text>
              <Text style={styles.distBadge}>{fac.distance}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.meta}>ICU Beds: <Text style={styles.bold}>{fac.icuBeds}</Text></Text>
              <Text style={styles.meta}>Ventilator: <Text style={styles.bold}>{fac.ventilators}</Text></Text>
            </View>

            <StaleDataWarning lastUpdatedAt={fac.lastUpdated} isEmergencyMode resourceName="facility beds" />
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
  card: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Spacing.borderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  facName: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary },
  distBadge: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.bold, color: Colors.primary },
  row: { flexDirection: 'row', gap: Spacing.md, marginVertical: Spacing.xs },
  meta: { fontSize: Typography.fontSizes.xs, color: Colors.textSecondary },
  bold: { fontWeight: Typography.fontWeights.bold, color: Colors.textPrimary },
});

export default NearbyFacilitiesScreen;
