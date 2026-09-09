// ASHA Worker Navigation Stack — React Native
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AshaStackParamList } from './types';
import { AshaHomeScreen } from '../screens/home/AshaHomeScreen';
import { ReferralListScreen } from '../screens/asha/ReferralListScreen';
import { CreateReferralScreen } from '../screens/asha/CreateReferralScreen';
import { BedAvailabilityScreen } from '../screens/availability/BedAvailabilityScreen';
import { BookAppointmentScreen } from '../screens/asha/BookAppointmentScreen';
import { EmergencyDispatchScreen } from '../screens/asha/EmergencyDispatchScreen';

const Stack = createNativeStackNavigator<AshaStackParamList>();

export const AshaNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AshaHome" component={AshaHomeScreen} />
      <Stack.Screen name="ReferralList" component={ReferralListScreen} />
      <Stack.Screen name="CreateReferral" component={CreateReferralScreen} />
      <Stack.Screen name="FacilityAvailability" component={BedAvailabilityScreen} />
      <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} />
      <Stack.Screen name="EmergencyDispatch" component={EmergencyDispatchScreen} />
    </Stack.Navigator>
  );
};

export default AshaNavigator;
