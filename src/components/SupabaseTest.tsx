import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase, isSupabaseConfigured } from '../config/supabase';

const SupabaseTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkInitialConnection();
  }, []);

  const checkInitialConnection = async () => {
    try {
      // Check if configured
      if (!isSupabaseConfigured()) {
        setConnectionStatus('❌ Not configured - Please update API keys');
        return;
      }

      // Test basic connection
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        setConnectionStatus(`❌ Connection Error: ${error.message}`);
      } else {
        setConnectionStatus('✅ Connected to Supabase!');
      }
    } catch (error) {
      setConnectionStatus(`❌ Unexpected Error: ${error}`);
    }
  };

  const testDatabaseQueries = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Testing Supabase Database Queries...');

      // Test 1: Check tables exist
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['users', 'bikes', 'bookings', 'notifications']);

      if (tablesError) {
        Alert.alert('Table Check Failed', tablesError.message);
        setIsLoading(false);
        return;
      }

      console.log('📋 Tables found:', tables?.map(t => t.table_name));

      // Test 2: Check auth connection
      const { data: authData, error: authError } = await supabase.auth.getSession();
      console.log('🔐 Auth session:', authData.session ? 'Active' : 'No session');

      // Test 3: Try to read from users table (should work with RLS)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (usersError) {
        console.log('👤 Users table access:', usersError.message);
      } else {
        console.log('👤 Users table accessible');
      }

      // Test 4: Try to read from bikes table (should work - public read)
      const { data: bikesData, error: bikesError } = await supabase
        .from('bikes')
        .select('id, name')
        .eq('is_approved', true)
        .limit(3);

      if (bikesError) {
        console.log('🏍️ Bikes table access:', bikesError.message);
      } else {
        console.log('🏍️ Bikes found:', bikesData?.length || 0);
      }

      Alert.alert(
        'Test Results',
        `✅ Database connection working!\n\n` +
        `📋 Tables: ${tables?.length || 0}/4 found\n` +
        `🔐 Auth: ${authData.session ? 'Active' : 'No session'}\n` +
        `🏍️ Bikes: ${bikesData?.length || 0} found\n\n` +
        `Check console for detailed logs.`
      );

    } catch (error) {
      console.error('❌ Test failed:', error);
      Alert.alert('Test Failed', `Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testAuthentication = async () => {
    setIsLoading(true);
    try {
      console.log('🔐 Testing Supabase Authentication...');

      // Test sign up with temporary email
      const testEmail = `test+${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';

      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      if (error) {
        if (error.message.includes('already registered')) {
          Alert.alert('Auth Test', '✅ Auth working! (Email already exists)');
        } else {
          Alert.alert('Auth Error', error.message);
        }
      } else {
        Alert.alert(
          'Auth Test Success', 
          `✅ Auth working!\n\n${data.user ? 'User created' : 'Confirmation required'}`
        );
        
        // Clean up - sign out
        await supabase.auth.signOut();
      }

      console.log('🔐 Auth test completed');
    } catch (error) {
      console.error('❌ Auth test failed:', error);
      Alert.alert('Auth Test Failed', `Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getConnectionInfo = () => {
    // Import URL and key from config since supabase client properties are protected
    const url = 'https://snpvblyhwkmuobynfrfe.supabase.co';
    const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    
    return `🌐 URL: ${url}\n🔑 Key: ${key.substring(0, 20)}...`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Supabase Connection Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{connectionStatus}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>{getConnectionInfo()}</Text>
      </View>

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={checkInitialConnection}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>🔄 Test Connection</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={testDatabaseQueries}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>📊 Test Database</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={testAuthentication}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>🔐 Test Auth</Text>
      </TouchableOpacity>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Testing...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    margin: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  statusText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
  },
  infoContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default SupabaseTest; 