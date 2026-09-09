// Facility Admin Navigation Stack — React Native
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FacilityAdminStackParamList } from './types';
import { FacilityAdminHomeScreen } from '../screens/home/FacilityAdminHomeScreen';
import { BedManagementScreen } from '../screens/facilityadmin/BedManagementScreen';
import { EquipmentManagementScreen } from '../screens/facilityadmin/EquipmentManagementScreen';
import { MedicineInventoryScreen } from '../screens/facilityadmin/MedicineInventoryScreen';
import { FreshnessEscalationsScreen } from '../screens/facilityadmin/FreshnessEscalationsScreen';

const Stack = createNativeStackNavigator<FacilityAdminStackParamList>();

export const FacilityAdminNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FacilityDashboard" component={FacilityAdminHomeScreen} />
      <Stack.Screen name="BedManagement" component={BedManagementScreen} />
      <Stack.Screen name="EquipmentManagement" component={EquipmentManagementScreen} />
      <Stack.Screen name="MedicineInventory" component={MedicineInventoryScreen} />
      <Stack.Screen name="FreshnessEscalations" component={FreshnessEscalationsScreen} />
    </Stack.Navigator>
  );
};

export default FacilityAdminNavigator;
