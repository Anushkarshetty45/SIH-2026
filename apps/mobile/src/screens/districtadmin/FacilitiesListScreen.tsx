// District Admin Facilities List Screen — React Native
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../theme';
import { FacilityCard } from '../../components';
import { Facility } from '../../types';

export const FacilitiesListScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const facilities: Facility[] = [
    {
      id: 'fac-sdh-manchar',
      name: 'Sub-District Hospital Manchar',
      type: 'CHC',
      status: 'ACTIVE',
      address: 'Manchar, Ambegaon',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '410503',
      lastUpdatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'fac-phc-khed',
      name: 'Primary Health Centre Khed',
      type: 'PHC',
      status: 'ACTIVE',
      address: 'Khed, Rajgurunagar',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '410501',
      lastUpdatedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'fac-dh-aundh',
      name: 'District Hospital Aundh',
      type: 'DISTRICT_HOSPITAL',
      status: 'ACTIVE',
      address: 'Aundh, Pune',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411027',
      lastUpdatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'fac-phc-narayangaon',
      name: 'Primary Health Centre Narayangaon',
      type: 'PHC',
      status: 'ACTIVE',
      address: 'Narayangaon, Junnar',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '410504',
      lastUpdatedAt: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
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
        <Text style={styles.title}>District Facilities ({facilities.length})</Text>
        <Text style={styles.subtitle}>Health institutions under Pune District Administration</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {facilities.map((fac) => (
          <FacilityCard
            key={fac.id}
            facility={fac}
            totalBeds={fac.type === 'DISTRICT_HOSPITAL' ? 200 : fac.type === 'CHC' ? 60 : 12}
            availableBeds={fac.type === 'DISTRICT_HOSPITAL' ? 45 : fac.type === 'CHC' ? 14 : 2}
          />
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
});

export default FacilitiesListScreen;
