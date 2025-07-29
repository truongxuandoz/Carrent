import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';

interface TabBarIconProps {
  route: RouteProp<any>;
  focused: boolean;
  color: string;
  size: number;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({ route, focused, color, size }) => {
  let iconName: keyof typeof Ionicons.glyphMap;

  if (route.name === 'Home') {
    iconName = focused ? 'home' : 'home-outline';
  } else if (route.name === 'History') {
    iconName = focused ? 'time' : 'time-outline';
  } else if (route.name === 'Notifications') {
    iconName = focused ? 'notifications' : 'notifications-outline';
  } else if (route.name === 'Profile') {
    iconName = focused ? 'person' : 'person-outline';
  } else if (route.name === 'Admin') {
    iconName = focused ? 'settings' : 'settings-outline';
  } else {
    iconName = 'help-outline';
  }

  return <Ionicons name={iconName} size={size} color={color} />;
};

export default TabBarIcon; 