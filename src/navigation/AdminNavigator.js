import React from 'react';
import { Platform, View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';

import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import ActivityLogScreen from '../screens/admin/ActivityLogScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import AddFurnitureScreen from '../screens/admin/AddFurnitureScreen';
import EditFurnitureScreen from '../screens/admin/EditFurnitureScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function AdminHomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminHomeMain" component={AdminHomeScreen} />
      <Stack.Screen name="AddFurniture" component={AddFurnitureScreen} />
      <Stack.Screen name="EditFurniture" component={EditFurnitureScreen} />
    </Stack.Navigator>
  );
}

// ── Web screen padding HOC ────────────────────────────────────
function withWebPadding(Component) {
  return function WrappedComponent(props) {
    if (Platform.OS === 'web') {
      return (
        <View style={{ flex: 1, paddingLeft: 220, backgroundColor: Colors.background }}>
          <Component {...props} />
        </View>
      );
    }
    return <Component {...props} />;
  };
}

const PaddedAdminHomeStack = withWebPadding(AdminHomeStack);
const PaddedActivityLogScreen = withWebPadding(ActivityLogScreen);
const PaddedAdminProfileScreen = withWebPadding(AdminProfileScreen);

// ── Web sidebar layout ────────────────────────────────────────
function WebSidebar({ state, navigation }) {
  const tabs = [
    { name: 'Inventory', icon: 'cube-outline', iconFocused: 'cube' },
    { name: 'Activity', icon: 'time-outline', iconFocused: 'time' },
    { name: 'AdminProfile', icon: 'shield-outline', iconFocused: 'shield', label: 'Profile' },
  ];

  return (
    <View style={sidebarStyles.sidebar}>
      <View style={sidebarStyles.brandRow}>
        <Text style={sidebarStyles.brandText}>Furnify</Text>
        <Text style={sidebarStyles.brandSub}>Admin</Text>
      </View>
      {tabs.map((tab, index) => {
        const isFocused = state.index === index;
        return (
          <TouchableOpacity
            key={tab.name}
            style={[sidebarStyles.navItem, isFocused && sidebarStyles.navItemActive]}
            onPress={() => navigation.navigate(tab.name)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isFocused ? tab.iconFocused : tab.icon}
              size={22}
              color={isFocused ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[sidebarStyles.navLabel, isFocused && sidebarStyles.navLabelActive]}>
              {tab.label || tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const sidebarStyles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 220,
    backgroundColor: Colors.surface,
    paddingTop: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    ...Shadows.md,
    zIndex: 1000,
  },
  brandRow: {
    marginBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.sm,
  },
  brandText: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.extraBold,
    color: Colors.text,
  },
  brandSub: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
    letterSpacing: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  navItemActive: {
    backgroundColor: Colors.primarySurface,
  },
  navLabel: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
  },
  navLabelActive: {
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
  },
});

// ── Shared tab screen options ─────────────────────────────────
const tabScreenOptions = ({ route }) => ({
  headerShown: false,
  tabBarIcon: ({ focused, color, size }) => {
    const icons = {
      Inventory: focused ? 'cube' : 'cube-outline',
      Activity: focused ? 'time' : 'time-outline',
      AdminProfile: focused ? 'shield' : 'shield-outline',
    };
    return <Ionicons name={icons[route.name]} size={size} color={color} />;
  },
  tabBarActiveTintColor: Colors.primary,
  tabBarInactiveTintColor: Colors.textMuted,
  tabBarStyle: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 0,
    shadowOpacity: 0,
    height: 64,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default function AdminNavigator() {
  const isWeb = Platform.OS === 'web';

  return (
    <Tab.Navigator
      tabBar={isWeb ? (props) => <WebSidebar {...props} /> : undefined}
      screenOptions={isWeb ? { headerShown: false } : tabScreenOptions}
    >
      <Tab.Screen name="Inventory" component={PaddedAdminHomeStack} />
      <Tab.Screen name="Activity" component={PaddedActivityLogScreen} />
      <Tab.Screen
        name="AdminProfile"
        component={PaddedAdminProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
