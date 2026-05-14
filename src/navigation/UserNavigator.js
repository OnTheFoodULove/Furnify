import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';

import HomeScreen from '../screens/user/HomeScreen';
import CartScreen from '../screens/user/CartScreen';
import UserProfileScreen from '../screens/user/UserProfileScreen';
import FurnitureDetailScreen from '../screens/user/FurnitureDetailScreen';
import ImagePlacementScreen from '../screens/user/ImagePlacementScreen';
import EditProfileScreen from '../screens/user/EditProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function UserProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserProfileMain" component={UserProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="FurnitureDetail" component={FurnitureDetailScreen} />
      <Stack.Screen name="ImagePlacement" component={ImagePlacementScreen} />
    </Stack.Navigator>
  );
}

export default function UserNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
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
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile" component={UserProfileStack} />
    </Tab.Navigator>
  );
}
