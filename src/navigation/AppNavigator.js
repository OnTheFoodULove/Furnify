import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Shared
import SplashScreen from '../screens/shared/SplashScreen';
import OnboardingScreen from '../screens/shared/OnboardingScreen';

// Auth
import AdminLoginScreen from '../screens/auth/AdminLoginScreen';
import UserLoginScreen from '../screens/auth/UserLoginScreen';
import UserSignUpScreen from '../screens/auth/UserSignUpScreen';

// Navigators
import AdminNavigator from './AdminNavigator';
import UserNavigator from './UserNavigator';

const Stack = createStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserLogin" component={UserLoginScreen} />
      <Stack.Screen name="UserSignUp" component={UserSignUpScreen} />
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="AuthStack" component={AuthStack} />
      
      {/* Main App Stacks */}
      <Stack.Screen name="AdminTabs" component={AdminNavigator} />
      <Stack.Screen name="UserTabs" component={UserNavigator} />
    </Stack.Navigator>
  );
}
