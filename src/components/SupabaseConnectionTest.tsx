import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../config/supabase';

const SupabaseConnectionTest: React.FC = () => {
  const [status, setStatus] = useState('Not tested');
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setStatus('Testing...');
    
    try {
      // Test 1: Basic connection
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      if (error) {
        setStatus(`❌ Connection Error: ${error.message}`);
        console.error('Supabase Error:', error);
        return;
      }

      // Test 2: Auth test
      const { data: { user } } = await supabase.auth.getUser();
      
      setStatus(`✅ Connected! User: ${user ? user.email : 'Not logged in'}`);
      
    } catch (error) {
      setStatus(`❌ Error: ${error}`);
      console.error('Test Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testSignUp = async () => {
    setIsLoading(true);
    
    try {
      const testEmail = `test${Date.now()}@example.com`;
      const testPassword = 'password123';
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Test User',
            phone_number: '0123456789',
            role: 'customer',
          }
        }
      });

      if (error) {
        Alert.alert('Signup Error', error.message);
        setStatus(`❌ Signup Error: ${error.message}`);
        return;
      }

      Alert.alert('Success', `Account created: ${testEmail}`);
      setStatus(`✅ Account created: ${testEmail}`);
      
    } catch (error) {
      Alert.alert('Error', String(error));
      setStatus(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkTables = async () => {
    setIsLoading(true);
    setStatus('Checking tables...');
    
    try {
      // Check if tables exist
      const tableChecks = await Promise.all([
        supabase.from('users').select('count').limit(1),
        supabase.from('notifications').select('count').limit(1),
      ]);

      const results = tableChecks.map((result, index) => {
        const tableName = index === 0 ? 'users' : 'notifications';
        return `${tableName}: ${result.error ? '❌ Missing' : '✅ Exists'}`;
      });

      setStatus(`Tables:\n${results.join('\n')}`);
      
    } catch (error) {
      setStatus(`❌ Error checking tables: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔗 Supabase Connection Test</Text>
      
      <Text style={styles.status}>{status}</Text>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={testConnection}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Connection'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={checkTables}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Check Tables</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.buttonSecondary, isLoading && styles.buttonDisabled]} 
        onPress={testSignUp}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Test SignUp</Text>
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          URL: https://snpvblyhwkmuobynfrfe.supabase.co
        </Text>
        <Text style={styles.infoText}>
          Key: eyJhbGciOiJIUzI1NiIs...
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  status: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    minHeight: 60,
    textAlign: 'center',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonSecondary: {
    backgroundColor: '#28a745',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  info: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
});

export default SupabaseConnectionTest; 