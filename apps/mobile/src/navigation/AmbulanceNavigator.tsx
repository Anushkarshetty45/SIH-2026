// Ambulance Emergency Navigation Stack — React Native
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AmbulanceStackParamList } from './types';
import { AmbulanceHomeScreen } from '../screens/home/AmbulanceHomeScreen';
import { EmergencyModeScreen } from '../screens/ambulance/EmergencyModeScreen';
import { NearbyFacilitiesScreen } from '../screens/ambulance/NearbyFacilitiesScreen';
import { TransportStatusScreen } from '../screens/ambulance/TransportStatusScreen';

const Stack = createNativeStackNavigator<AmbulanceStackParamList>();

export const AmbulanceNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AmbulanceHome" component={AmbulanceHomeScreen} />
      <Stack.Screen name="EmergencyMode" component={EmergencyModeScreen} />
      <Stack.Screen name="NearbyFacilities" component={NearbyFacilitiesScreen} />
      <Stack.Screen name="TransportStatus" component={TransportStatusScreen} />
    </Stack.Navigator>
  );
};

export default AmbulanceNavigator;
