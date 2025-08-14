import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';

// NativeWind CSS temporarily disabled

// Import navigation types
import { RootStackParamList, MainTabParamList } from './src/types/navigation';

// Import i18n
import './src/i18n';

// Import contexts
import { AuthProvider, useAuth } from './src/context/SimpleAuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';

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
import ErrorBoundary from './src/components/ErrorBoundary';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => {
  const { user, isAuthenticated } = useAuth();
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
        tabBarStyle: {
          backgroundColor: '#fff',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ tabBarLabel: t('navigation.home') }}
      />
      
      {/* Only show these tabs if user is authenticated */}
      {isAuthenticated ? (
        <>
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
          {/* Debug admin access */}
          {console.log('🔍 User role check:', user?.role, 'isAdmin:', user?.role === 'admin')}
          {user?.role === 'admin' && (
            <Tab.Screen 
              name="Admin" 
              component={AdminScreen} 
              options={{ tabBarLabel: t('navigation.admin') }}
            />
          )}
        </>
      ) : (
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ tabBarLabel: t('navigation.profile') }}
        />
      )}
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isLoading, operationLoading, isAuthenticated, user } = useAuth();

  // Show loading screen while auth is initializing or during operations
  if (isLoading || operationLoading) {
    return <LoadingScreen />;
  }

  // Show login screen if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ 
              headerShown: true,
              title: 'Đăng nhập',
              headerTitleAlign: 'center',
              gestureEnabled: false,
              headerLeft: () => null,
            }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen}
            options={{ 
              headerShown: true,
              title: 'Đăng ký',
              headerTitleAlign: 'center',
              gestureEnabled: true,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Show main app when authenticated
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="BikeDetail" component={BikeDetailScreen} />
        <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
        <Stack.Screen name="BookingDetailView" component={BookingDetailViewScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <ErrorBoundary>
              <AppNavigator />
            </ErrorBoundary>
            <StatusBar style="auto" />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
