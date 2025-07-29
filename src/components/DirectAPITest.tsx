import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const DirectAPITest: React.FC = () => {
  const [status, setStatus] = useState('Ready to test');
  const [isLoading, setIsLoading] = useState(false);

  const testDirectAPI = async () => {
    setIsLoading(true);
    setStatus('Testing direct API...');

    try {
      const url = 'https://snpvblyhwkmuobynfrfe.supabase.co/auth/v1/signup';
      const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHZibHlod2ttdW9ieW5mcmZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzM1NjUsImV4cCI6MjA2OTM0OTU2NX0.IBR0I3PEly__eSWtAw5dtXTB1zvEOnObHlVmrvLwUOg';
      
      const testEmail = `test${Date.now()}@example.com`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          email: testEmail,
          password: 'password123',
          data: {
            full_name: 'Direct API Test User',
            phone_number: '0123456789',
            role: 'customer',
          }
        })
      });

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }

      if (response.ok) {
        setStatus(`✅ SUCCESS!\nStatus: ${response.status}\nEmail: ${testEmail}\nUser ID: ${responseData.user?.id || 'N/A'}\nSession: ${responseData.session ? 'Yes' : 'No'}`);
        
        Alert.alert(
          '🎉 Success!', 
          `Account created successfully!\n\nEmail: ${testEmail}\nPassword: password123\n\nYou can now login with these credentials.`
        );
      } else {
        const errorHeaders: string[] = [];
        response.headers.forEach((value, key) => {
          if (key.includes('error') || key.includes('sb_')) {
            errorHeaders.push(`${key}: ${value}`);
          }
        });

        setStatus(`❌ FAILED!\nStatus: ${response.status}\nResponse: ${JSON.stringify(responseData, null, 2)}\n\nHeaders:\n${errorHeaders.join('\n')}`);
        
        Alert.alert(
          '❌ API Error', 
          `Status: ${response.status}\nError: ${responseData.message || responseData.error_description || 'Unknown error'}\n\n🔧 Fix: Enable email auth in Supabase Dashboard!`
        );
      }

    } catch (error) {
      setStatus(`❌ NETWORK ERROR:\n${error}`);
      Alert.alert('Network Error', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const testLoginAPI = async () => {
    setIsLoading(true);
    setStatus('Testing login API...');

    try {
      const url = 'https://snpvblyhwkmuobynfrfe.supabase.co/auth/v1/token?grant_type=password';
      const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHZibHlod2ttdW9ieW5mcmZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzM1NjUsImV4cCI6MjA2OTM0OTU2NX0.IBR0I3PEly__eSWtAw5dtXTB1zvEOnObHlVmrvLwUOg';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }

      if (response.ok) {
        setStatus(`✅ LOGIN SUCCESS!\nStatus: ${response.status}\nUser: ${responseData.user?.email || 'N/A'}\nToken: ${responseData.access_token ? 'Yes' : 'No'}`);
        
        Alert.alert('🎉 Login Success!', 'Authentication is working correctly!');
      } else {
        setStatus(`❌ LOGIN FAILED!\nStatus: ${response.status}\nResponse: ${JSON.stringify(responseData, null, 2)}`);
        
        Alert.alert(
          '❌ Login Failed', 
          `Status: ${response.status}\nError: ${responseData.message || 'Login failed'}\n\nTry creating account first.`
        );
      }

    } catch (error) {
      setStatus(`❌ LOGIN ERROR:\n${error}`);
      Alert.alert('Login Error', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔗 Direct API Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{status}</Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.button, styles.primaryButton, isLoading && styles.buttonDisabled]} 
        onPress={testDirectAPI}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : '🧪 Test Signup API'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton, isLoading && styles.buttonDisabled]} 
        onPress={testLoginAPI}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>🔐 Test Login API</Text>
      </TouchableOpacity>

      <Text style={styles.infoText}>
        This tests Supabase API directly to verify email auth is enabled.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#fff3cd',
    borderRadius: 10,
    margin: 15,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  statusText: {
    fontSize: 11,
    color: '#495057',
    lineHeight: 16,
    fontFamily: 'monospace',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#28a745',
  },
  secondaryButton: {
    backgroundColor: '#007bff',
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});

export default DirectAPITest; 