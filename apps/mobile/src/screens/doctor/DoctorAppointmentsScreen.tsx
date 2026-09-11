// Doctor Appointments Screen — React Native
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../theme';
import { AppointmentCard } from '../../components';
import { Appointment } from '../../types';

export const DoctorAppointmentsScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const appointments: Appointment[] = [
    {
      id: 'apt-001',
      patientId: 'pat-001',
      doctorId: 'doc-001',
      facilityId: 'fac-sdh-manchar',
      slotId: 'slot-1',
      status: 'CONFIRMED',
      notes: 'Follow-up for seasonal asthma and prescription review.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      patient: { id: 'pat-001', name: 'Ramesh Shinde', preferredLanguage: 'MARATHI', consentStatus: 'GRANTED' },
      doctor: { id: 'doc-001', userId: 'user-doc-001', registrationNo: 'MH-DOC-44812', specialization: 'General Medicine', isAvailable: true, facilityId: 'fac-sdh-manchar' },
      facility: { id: 'fac-sdh-manchar', name: 'Sub-District Hospital Manchar', type: 'CHC', status: 'ACTIVE', address: '', district: 'Pune', state: 'MH', pincode: '410503', lastUpdatedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
      slot: { id: 'slot-1', doctorId: 'doc-001', facilityId: 'fac-sdh-manchar', date: new Date().toISOString(), startTime: '10:00 AM', endTime: '10:30 AM', status: 'BOOKED' },
    },
    {
      id: 'apt-002',
      patientId: 'pat-002',
      doctorId: 'doc-001',
      facilityId: 'fac-sdh-manchar',
      slotId: 'slot-2',
      status: 'SCHEDULED',
      notes: 'New patient referral consultation.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      patient: { id: 'pat-002', name: 'Anusaya Gaikwad', preferredLanguage: 'MARATHI', consentStatus: 'GRANTED' },
      doctor: { id: 'doc-001', userId: 'user-doc-001', registrationNo: 'MH-DOC-44812', specialization: 'General Medicine', isAvailable: true, facilityId: 'fac-sdh-manchar' },
      facility: { id: 'fac-sdh-manchar', name: 'Sub-District Hospital Manchar', type: 'CHC', status: 'ACTIVE', address: '', district: 'Pune', state: 'MH', pincode: '410503', lastUpdatedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
      slot: { id: 'slot-2', doctorId: 'doc-001', facilityId: 'fac-sdh-manchar', date: new Date().toISOString(), startTime: '11:30 AM', endTime: '12:00 PM', status: 'BOOKED' },
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
        <Text style={styles.title}>Doctor OPD Schedule</Text>
        <Text style={styles.subtitle}>Scheduled consultations and patient queue</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {appointments.map((apt) => (
          <AppointmentCard key={apt.id} appointment={apt} />
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

export default DoctorAppointmentsScreen;
