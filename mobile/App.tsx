import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/Auth/LoginScreen';
import RegisterScreen from './src/screens/Auth/RegisterScreen';
import EmergencyScreen from './src/screens/Emergency/EmergencyScreen';
import PatientTabs from './src/screens/Patient/PatientTabs';
import DoctorTabs from './src/screens/Doctor/DoctorTabs';

const Stack = createStackNavigator();

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0F2D52',
    secondary: '#00A896',
  },
};

const stackOptions = {
  headerStyle: { backgroundColor: '#0F2D52' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' as const },
};

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F6F9' }}>
        <ActivityIndicator size="large" color="#0F2D52" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={stackOptions}>
      {!user ? (
        // ── Écrans non authentifiés ────────────────────────────────────────
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Inscription' }} />
          <Stack.Screen name="Emergency" component={EmergencyScreen} options={{ title: 'Urgence Médicale' }} />
        </>
      ) : user.role === 'DOCTOR' ? (
        // ── Interface médecin ──────────────────────────────────────────────
        <Stack.Screen name="DoctorHome" component={DoctorTabs} options={{ headerShown: false }} />
      ) : (
        // ── Interface patient ──────────────────────────────────────────────
        <>
          <Stack.Screen name="PatientHome" component={PatientTabs} options={{ headerShown: false }} />
          <Stack.Screen name="Emergency" component={EmergencyScreen} options={{ title: 'Urgence Médicale' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </PaperProvider>
  );
}
