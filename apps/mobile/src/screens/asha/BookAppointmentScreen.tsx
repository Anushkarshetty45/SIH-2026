// ASHA Book Appointment Screen — React Native
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../theme';
import { Button, TextInput } from '../../components';
import { useOffline } from '../../context/OfflineContext';

export const BookAppointmentScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { enqueueMutation } = useOffline();

  const [patientName, setPatientName] = useState('');
  const [doctorName, setDoctorName] = useState('Dr. Rahul Deshmukh (General Medicine)');
  const [date, setDate] = useState('2026-09-15');
  const [timeSlot, setTimeSlot] = useState('11:00 AM');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleBook = () => {
    if (!patientName.trim()) {
      Alert.alert('Required', 'Please enter patient name.');
      return;
    }

    setSubmitting(true);
    try {
      enqueueMutation('APPOINTMENT', 'CREATE', {
        patientName: patientName.trim(),
        doctorName,
        date,
        timeSlot,
        notes: notes.trim(),
        facilityId: 'fac-sdh-manchar',
      });

      Alert.alert('Appointment Booked', 'Appointment successfully reserved and queued for sync.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to queue appointment booking.');
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
        <Text style={styles.title}>Book OPD Appointment</Text>
        <Text style={styles.subtitle}>Reserve consultation slots for rural patients</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <TextInput
            label="Patient Name"
            placeholder="e.g. Ramesh Shinde"
            value={patientName}
            onChangeText={setPatientName}
            required
          />

          <TextInput
            label="Selected Clinician"
            value={doctorName}
            onChangeText={setDoctorName}
          />

          <TextInput
            label="Date (YYYY-MM-DD)"
            value={date}
            onChangeText={setDate}
            required
          />

          <TextInput
            label="Time Slot"
            value={timeSlot}
            onChangeText={setTimeSlot}
            required
          />

          <TextInput
            label="Reason for Visit / Clinical Notes"
            placeholder="e.g. Chronic joint pain, hypertension follow-up"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <View style={styles.btnWrapper}>
            <Button
              title="Confirm Appointment Booking"
              onPress={handleBook}
              isLoading={submitting}
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
  btnWrapper: { marginTop: Spacing.lg },
});

export default BookAppointmentScreen;
