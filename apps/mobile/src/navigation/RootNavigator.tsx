// Root Navigation Dispatcher with Role-Based Routing — React Native
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/LoadingState';
import { Button } from '../components/Button';
import { getRootFlowForRole } from './routes';
import { Colors, Spacing, Typography } from '../theme';
import { t } from '../i18n';
import { RootStackParamList } from './types';

import { AuthNavigator } from './AuthNavigator';
import { AshaNavigator } from './AshaNavigator';
import { DoctorNavigator } from './DoctorNavigator';
import { AmbulanceNavigator } from './AmbulanceNavigator';
import { FacilityAdminNavigator } from './FacilityAdminNavigator';
import { DistrictAdminNavigator } from './DistrictAdminNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const PermissionDeniedScreen: React.FC = () => {
  const { logout } = useAuth();
  return (
    <View style={styles.permissionDeniedContainer}>
      <Text style={styles.deniedIcon} accessibilityElementsHidden={true} importantForAccessibility="no">
        🚫
      </Text>
      <Text style={styles.deniedTitle}>
        403 — {t('errors.forbidden')}
      </Text>
      <Text style={styles.deniedSubtitle}>
        You do not have access to this role module. Please log in with an authorized account.
      </Text>
      <View style={styles.logoutButtonWrapper}>
        <Button title={t('auth.logout')} onPress={logout} variant="primary" />
      </View>
    </View>
  );
};

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingState message={t('common.loading')} />
      </View>
    );
  }

  const activeFlow = !isAuthenticated || !role ? 'Auth' : getRootFlowForRole(role);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {activeFlow === 'Auth' && (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
        {activeFlow === 'AshaFlow' && (
          <Stack.Screen name="AshaFlow" component={AshaNavigator} />
        )}
        {activeFlow === 'DoctorFlow' && (
          <Stack.Screen name="DoctorFlow" component={DoctorNavigator} />
        )}
        {activeFlow === 'AmbulanceFlow' && (
          <Stack.Screen name="AmbulanceFlow" component={AmbulanceNavigator} />
        )}
        {activeFlow === 'FacilityAdminFlow' && (
          <Stack.Screen name="FacilityAdminFlow" component={FacilityAdminNavigator} />
        )}
        {activeFlow === 'DistrictAdminFlow' && (
          <Stack.Screen name="DistrictAdminFlow" component={DistrictAdminNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  permissionDeniedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  deniedIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  deniedTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.emergency.surface,
    textAlign: 'center',
  },
  deniedSubtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    marginVertical: Spacing.md,
    textAlign: 'center',
    maxWidth: 300,
  },
  logoutButtonWrapper: {
    width: 160,
    marginTop: Spacing.md,
  },
});

export default RootNavigator;
