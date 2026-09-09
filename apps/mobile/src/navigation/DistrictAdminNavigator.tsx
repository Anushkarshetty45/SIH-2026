// District Admin Navigation Stack — React Native
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DistrictAdminStackParamList } from './types';
import { DistrictAdminHomeScreen } from '../screens/home/DistrictAdminHomeScreen';
import { FacilitiesListScreen } from '../screens/districtadmin/FacilitiesListScreen';
import { StaleAlertsScreen } from '../screens/districtadmin/StaleAlertsScreen';
import { EscalationsViewScreen } from '../screens/districtadmin/EscalationsViewScreen';

const Stack = createNativeStackNavigator<DistrictAdminStackParamList>();

export const DistrictAdminNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DistrictOverview" component={DistrictAdminHomeScreen} />
      <Stack.Screen name="FacilitiesList" component={FacilitiesListScreen} />
      <Stack.Screen name="StaleAlerts" component={StaleAlertsScreen} />
      <Stack.Screen name="EscalationsView" component={EscalationsViewScreen} />
    </Stack.Navigator>
  );
};

export default DistrictAdminNavigator;
