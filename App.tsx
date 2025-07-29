import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';

// Import navigation types
import { RootStackParamList, MainTabParamList } from './src/types/navigation';

// Import i18n
import './src/i18n';

// Import contexts
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Import screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AdminScreen from './src/screens/AdminScreen';
import BikeDetailScreen from './src/screens/BikeDetailScreen';
import BookingDetailScreen from './src/screens/BookingDetailScreen';
import BookingDetailViewScreen from './src/screens/BookingDetailViewScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LoadingScreen from './src/screens/LoadingScreen';

// Import components
import TabBarIcon from './src/components/TabBarIcon';
import AuthStateDebug from './src/components/AuthStateDebug';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <TabBarIcon route={route} focused={focused} color={color} size={size} />
        ),
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ tabBarLabel: t('navigation.home') }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen} 
        options={{ tabBarLabel: t('navigation.history') }}
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{ tabBarLabel: t('navigation.notifications') }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarLabel: t('navigation.profile') }}
      />
      {user?.role === 'admin' && (
        <Tab.Screen 
          name="Admin" 
          component={AdminScreen} 
          options={{ tabBarLabel: t('navigation.admin') }}
        />
      )}
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="BikeDetail" component={BikeDetailScreen} />
            <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
            <Stack.Screen name="BookingDetailView" component={BookingDetailViewScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AuthStateDebug />
          <AppNavigator />
          <StatusBar style="auto" />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
