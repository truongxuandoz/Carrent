import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { useAuth } from '../context/SimpleAuthContext';
import { getSafeImageSource, handleImageError, generatePlaceholder } from '../utils/placeholderImage';

const AdminDebugger = () => {
  const { user, isAuthenticated, clearAdminCache, isAdminUser } = useAuth();

  const showDebugInfo = () => {
    const debugInfo = {
      isAuthenticated,
      userExists: !!user,
      userEmail: user?.email,
      userRole: user?.role,
      userIsActive: user?.isActive,
      userFullObject: user,
    };

    Alert.alert(
      'Admin Debug Info',
      JSON.stringify(debugInfo, null, 2),
      [{ text: 'OK' }]
    );
    
    console.log('🔍 Admin Debug Info:', debugInfo);
  };

  const forceAdminRole = async () => {
    if (!user) {
      Alert.alert('Error', 'No user logged in');
      return;
    }
    
    try {
      const { supabase } = require('../config/supabase');
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      console.log('🔧 Force setting admin role for:', user.email);
      
      // Update auth metadata
      await supabase.auth.updateUser({
        data: { role: 'admin' }
      });
      
      // Update cache
      await AsyncStorage.setItem('user-role', 'admin');
      
      Alert.alert('Success', 'Admin role set! Please restart the app to see the Admin tab.');
      console.log('✅ Admin role forced for user');
    } catch (error) {
      console.error('❌ Error setting admin role:', error);
      Alert.alert('Error', 'Failed to set admin role: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleClearAdminCache = async () => {
    try {
      await clearAdminCache();
      Alert.alert('Success', 'Admin cache cleared! Please restart the app to see changes.');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear admin cache: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const checkRealAdminStatus = async () => {
    try {
      const isAdmin = await isAdminUser();
      Alert.alert(
        'Database Admin Check',
        `Real admin status from database: ${isAdmin ? 'YES' : 'NO'}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to check admin status: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const testPlaceholders = () => {
    console.log('🧪 Testing placeholders...');
    
    try {
      // Test safe image sources
      const bikeSource = getSafeImageSource(null, 'bike');
      const userSource = getSafeImageSource(null, 'user');
      const genericSource = getSafeImageSource(null, 'generic');
      
      console.log('BIKE fallback:', bikeSource.uri.substring(0, 100) + '...');
      console.log('USER fallback:', userSource.uri.substring(0, 100) + '...');
      console.log('GENERIC fallback:', genericSource.uri.substring(0, 100) + '...');
      
      // Test custom generation
      const customPlaceholder = generatePlaceholder({
        width: 200,
        height: 100,
        type: 'bike'
      });
      console.log('Custom placeholder:', customPlaceholder.substring(0, 100) + '...');
      
      Alert.alert('Placeholder Test', 'Check console for placeholder data. All placeholders generated successfully!');
    } catch (error) {
      console.error('❌ Placeholder test failed:', error);
      Alert.alert('Placeholder Test Failed', error instanceof Error ? error.message : String(error));
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Access Debug</Text>
      
      <View style={styles.row}>
        <Text style={styles.label}>Authenticated:</Text>
        <Text style={[styles.value, { color: isAuthenticated ? 'green' : 'red' }]}>
          {isAuthenticated ? 'YES' : 'NO'}
        </Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>User Email:</Text>
        <Text style={styles.value}>{user?.email || 'No email'}</Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>User Role:</Text>
        <Text style={[styles.value, { color: isAdmin ? 'green' : 'orange' }]}>
          {user?.role || 'No role'}
        </Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Admin Access:</Text>
        <Text style={[styles.value, { color: isAdmin ? 'green' : 'red' }]}>
          {isAdmin ? 'GRANTED' : 'DENIED'}
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={showDebugInfo}>
        <Text style={styles.buttonText}>Show Full Debug Info</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.checkButton]} onPress={checkRealAdminStatus}>
        <Text style={styles.buttonText}>Check Real Admin Status</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={handleClearAdminCache}>
        <Text style={styles.buttonText}>Clear Admin Cache</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.testButton]} onPress={testPlaceholders}>
        <Text style={styles.buttonText}>Test Placeholders</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.adminButton]} onPress={forceAdminRole}>
        <Text style={styles.buttonText}>Force Admin Role</Text>
      </TouchableOpacity>
      
      {/* Visual placeholder test */}
      <View style={styles.placeholderTest}>
        <Text style={styles.label}>Placeholder Test:</Text>
        <View style={styles.placeholderRow}>
          <Image 
            source={getSafeImageSource(null, 'bike')} 
            style={styles.placeholderImage}
            onError={(error) => {
              console.error('❌ Error loading BIKE fallback:', error);
              handleImageError('bike');
            }}
            onLoad={() => console.log('✅ BIKE fallback loaded')}
          />
          <Image 
            source={getSafeImageSource(null, 'user')} 
            style={styles.placeholderImage}
            onError={(error) => {
              console.error('❌ Error loading USER fallback:', error);
              handleImageError('user');
            }}
            onLoad={() => console.log('✅ USER fallback loaded')}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  adminButton: {
    backgroundColor: '#FF6B6B',
  },
  checkButton: {
    backgroundColor: '#4CAF50',
  },
  clearButton: {
    backgroundColor: '#FF9800',
  },
  testButton: {
    backgroundColor: '#9C27B0',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  placeholderTest: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#F9F9F9',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  placeholderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 4,
  },
});

export default AdminDebugger; 