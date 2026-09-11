// ASHA Emergency Dispatch / 108 Screen — React Native
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../theme';
import { Button, TextInput } from '../../components';

export const EmergencyDispatchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [patientLocation, setPatientLocation] = useState('Khed Village Center, Pune');
  const [condition, setCondition] = useState('Critical Obstetric Hemorrhage');
  const [dispatched, setDispatched] = useState(false);

  const handleDispatch = () => {
    setDispatched(true);
    Alert.alert('108 Dispatch Triggered', 'Emergency dispatch broadcasted to 108 network. Ambulance MH-14-AZ-1080 assigned (ETA: 12 min).');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>🚨 Emergency 108 Dispatch</Text>
        <Text style={styles.subtitle}>Direct emergency ambulance requisition</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <TextInput
            label="Patient Location / Landmark"
            value={patientLocation}
            onChangeText={setPatientLocation}
            required
          />

          <TextInput
            label="Nature of Emergency"
            value={condition}
            onChangeText={setCondition}
            required
          />

          <View style={styles.btnWrapper}>
            <Button
              title={dispatched ? 'Dispatch Active (ETA 12m)' : 'REQUEST IMMEDIATE 108 AMBULANCE'}
              variant="danger"
              onPress={handleDispatch}
              disabled={dispatched}
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
  btnWrapper: { marginTop: Spacing.lg },
});

export default EmergencyDispatchScreen;
