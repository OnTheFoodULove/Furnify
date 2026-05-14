import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';

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

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Inventory') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Activity') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'AdminProfile') {
            iconName = focused ? 'shield' : 'shield-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Inventory" component={AdminHomeStack} />
      <Tab.Screen name="Activity" component={ActivityLogScreen} />
      <Tab.Screen 
        name="AdminProfile" 
        component={AdminProfileScreen} 
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
