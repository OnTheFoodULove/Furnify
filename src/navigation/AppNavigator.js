import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

// Shared
import SplashScreen from '../screens/shared/SplashScreen';
import OnboardingScreen from '../screens/shared/OnboardingScreen';
import WelcomeScreen from '../screens/shared/WelcomeScreen';

// Auth
import AdminLoginScreen from '../screens/auth/AdminLoginScreen';
import UserLoginScreen from '../screens/auth/UserLoginScreen';
import UserSignUpScreen from '../screens/auth/UserSignUpScreen';

// Navigators
import AdminNavigator from './AdminNavigator';
import UserNavigator from './UserNavigator';

// Auth context
import { useAuth } from '../context/AuthContext';
import { Colors, Typography, Spacing } from '../theme';

const Stack = createStackNavigator();

function AuthStack() {
  const isWeb = Platform.OS === 'web';
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={isWeb ? 'AdminLogin' : 'UserLogin'}
    >
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
      <Stack.Screen name="UserLogin" component={UserLoginScreen} />
      <Stack.Screen name="UserSignUp" component={UserSignUpScreen} />
    </Stack.Navigator>
  );
}

/**
 * Platform gate screen — signs the user out and shows a message.
 * Used when an admin logs in on mobile or a user logs in on web.
 */
function PlatformBlockScreen({ message }) {
  const { signOut } = useAuth();
  React.useEffect(() => {
    // Auto sign-out after showing the message briefly
    const t = setTimeout(() => signOut(), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={blockStyles.container}>
      <Text style={blockStyles.icon}>🚫</Text>
      <Text style={blockStyles.title}>Access Restricted</Text>
      <Text style={blockStyles.message}>{message}</Text>
    </View>
  );
}

const blockStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  icon: { fontSize: 56, marginBottom: Spacing.xl },
  title: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.size.base * 1.6,
  },
});

export default function AppNavigator() {
  const { session, profile, loading } = useAuth();

  // Show Splash while auth resolves
  if (loading) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  // ── Authenticated ──────────────────────────────────────────
  if (session && profile) {
    // Platform enforcement: admin = web only
    if (profile.role === 'admin' && Platform.OS !== 'web') {
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="PlatformBlock">
            {() => (
              <PlatformBlockScreen message="The admin panel is only accessible from a desktop browser. Please sign in on the web." />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      );
    }

    // Platform enforcement: users = mobile only
    if (profile.role === 'user' && Platform.OS === 'web') {
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="PlatformBlock">
            {() => (
              <PlatformBlockScreen message="Please use the Furnify mobile app to shop. The web version is for administrators only." />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      );
    }

    // Welcome screen: shown once per new account (has_seen_onboarding === false) (User only)
    if (profile.role === 'user' && profile.has_seen_onboarding === false) {
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
        </Stack.Navigator>
      );
    }

    // Admin: only admin navigator is mounted — no user routes exist
    if (profile.role === 'admin') {
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

  // ── Unauthenticated ────────────────────────────────────────
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="AuthStack" component={AuthStack} />
    </Stack.Navigator>
  );
}
