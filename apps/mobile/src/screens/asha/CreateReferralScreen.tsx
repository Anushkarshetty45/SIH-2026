// ASHA Create Referral Screen — React Native
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../theme';
import { Button, TextInput } from '../../components';
import { useOffline } from '../../context/OfflineContext';
import { ReferralUrgency } from '../../types';

export const CreateReferralScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { enqueueMutation } = useOffline();

  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [urgency, setUrgency] = useState<ReferralUrgency>('NORMAL');
  const [destinationFacility, setDestinationFacility] = useState('Sub-District Hospital Manchar');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!patientName.trim()) {
      Alert.alert('Required', 'Please enter patient name.');
      return;
    }

    setSubmitting(true);
    try {
      enqueueMutation('REFERRAL', 'CREATE', {
        patientName: patientName.trim(),
        patientAge: parseInt(patientAge, 10) || 30,
        urgency,
        destinationFacility,
        clinicalNotes: clinicalNotes.trim(),
        fromFacilityId: 'fac-phc-khed',
      });

      Alert.alert('Referral Queued', 'Patient referral submitted and queued for sync.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to queue referral.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Create Patient Referral</Text>
        <Text style={styles.subtitle}>Coordinate transfers between PHC and specialized facilities</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <TextInput
            label="Patient Name"
            placeholder="e.g. Sunita Patil"
            value={patientName}
            onChangeText={setPatientName}
            required
          />

          <TextInput
            label="Patient Age"
            placeholder="e.g. 34"
            value={patientAge}
            onChangeText={setPatientAge}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Urgency Level</Text>
          <View style={styles.urgencyRow}>
            {(['NORMAL', 'HIGH', 'EMERGENCY'] as ReferralUrgency[]).map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => setUrgency(level)}
                style={[
                  styles.urgencyPill,
                  urgency === level && (level === 'EMERGENCY' ? styles.urgencyEmergency : styles.urgencyActive),
                ]}
              >
                <Text
                  style={[
                    styles.urgencyText,
                    urgency === level && styles.urgencyTextActive,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            label="Destination Facility"
            value={destinationFacility}
            onChangeText={setDestinationFacility}
            required
          />

          <TextInput
            label="Clinical Notes / Symptoms"
            placeholder="e.g. High fever, labored breathing for 3 days..."
            value={clinicalNotes}
            onChangeText={setClinicalNotes}
            multiline
          />

          <View style={styles.btnWrapper}>
            <Button
              title="Submit Patient Referral"
              onPress={handleSubmit}
              isLoading={submitting}
              variant={urgency === 'EMERGENCY' ? 'danger' : 'primary'}
            />
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
  label: { fontSize: Typography.fontSizes.xs, color: Colors.textSecondary, marginBottom: 4 },
  urgencyRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
  urgencyPill: { flex: 1, paddingVertical: 8, borderRadius: Spacing.borderRadius.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceSubtle, alignItems: 'center' },
  urgencyActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySurface },
  urgencyEmergency: { borderColor: Colors.emergency.surface, backgroundColor: '#fee2e2' },
  urgencyText: { fontSize: Typography.fontSizes.xs, color: Colors.textSecondary, fontWeight: Typography.fontWeights.medium },
  urgencyTextActive: { color: Colors.primary, fontWeight: Typography.fontWeights.bold },
  btnWrapper: { marginTop: Spacing.lg },
});

export default CreateReferralScreen;
