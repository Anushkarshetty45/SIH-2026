// Doctor Clinical Navigation Stack — React Native
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DoctorStackParamList } from './types';
import { DoctorHomeScreen } from '../screens/home/DoctorHomeScreen';
import { IncomingReferralsScreen } from '../screens/doctor/IncomingReferralsScreen';
import { ReferralDetailScreen } from '../screens/doctor/ReferralDetailScreen';
import { DoctorAppointmentsScreen } from '../screens/doctor/DoctorAppointmentsScreen';
import { MedicineSearchScreen } from '../screens/inventory/MedicineSearchScreen';
import { FacilityBedsScreen } from '../screens/doctor/FacilityBedsScreen';

const Stack = createNativeStackNavigator<DoctorStackParamList>();

export const DoctorNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DoctorHome" component={DoctorHomeScreen} />
      <Stack.Screen name="IncomingReferrals" component={IncomingReferralsScreen} />
      <Stack.Screen name="ReferralDetail" component={ReferralDetailScreen} />
      <Stack.Screen name="DoctorAppointments" component={DoctorAppointmentsScreen} />
      <Stack.Screen name="MedicineSearch" component={MedicineSearchScreen} />
      <Stack.Screen name="FacilityBeds" component={FacilityBedsScreen} />
    </Stack.Navigator>
  );
};

export default DoctorNavigator;
