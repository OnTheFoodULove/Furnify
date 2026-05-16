import React, { useEffect, useRef } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Auth context
import { useAuth } from '../context/AuthContext';

const Stack = createStackNavigator();

const ONBOARDING_KEY = 'furnify_has_seen_onboarding';

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
  const { session, profile, loading } = useAuth();
  const navigationRef = useRef(null);

  /**
   * Once auth finishes loading AND the navigator is ready, automatically
   * route to the right screen based on role. This prevents any manual
   * navigation call from bypassing RBAC — the navigator itself enforces role.
   */

  // We derive the initial route:
  // • Still loading → show Splash
  // • Logged in as admin → AdminTabs
  // • Logged in as user → UserTabs
  // • Not logged in → Splash (which leads to Onboarding / AuthStack)

  // The trick: we use a nested component so Splash/Onboarding only render
  // when not authenticated, and admin/user stacks are only mounted when their
  // role matches. This makes unauthorized cross-navigation impossible at the
  // component level.

  if (loading) {
    // Show Splash while auth resolves — SplashScreen handles the short delay
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  // ── Authenticated ──────────────────────────────────────────────────
  if (session && profile) {
    if (profile.role === 'admin') {
      // Admin: only the admin navigator is mounted — no user routes exist
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="AdminTabs" component={AdminNavigator} />
        </Stack.Navigator>
      );
    }

    // User: only user routes — no admin routes exist
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="UserTabs" component={UserNavigator} />
      </Stack.Navigator>
    );
  }

  // ── Unauthenticated ────────────────────────────────────────────────
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="AuthStack" component={AuthStack} />
    </Stack.Navigator>
  );
}
