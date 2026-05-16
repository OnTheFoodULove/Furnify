import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast, { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
import { AuthProvider } from './src/context/AuthContext';
import { AgentProvider } from './src/context/AgentContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors, Typography, BorderRadius } from './src/theme';

// Custom Toast Configuration to match the app's theme
const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: Colors.success, backgroundColor: Colors.surface, borderRadius: BorderRadius.md }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.bold,
        color: Colors.text,
      }}
      text2Style={{
        fontSize: Typography.size.sm,
        color: Colors.textSecondary,
      }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: Colors.error, backgroundColor: Colors.surface, borderRadius: BorderRadius.md }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.bold,
        color: Colors.text,
      }}
      text2Style={{
        fontSize: Typography.size.sm,
        color: Colors.textSecondary,
      }}
    />
  ),
  info: (props) => (
    <InfoToast
      {...props}
      style={{ borderLeftColor: Colors.info, backgroundColor: Colors.surface, borderRadius: BorderRadius.md }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.bold,
        color: Colors.text,
      }}
      text2Style={{
        fontSize: Typography.size.sm,
        color: Colors.textSecondary,
      }}
    />
  ),
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AgentProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </AgentProvider>
      </AuthProvider>
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  );
}
