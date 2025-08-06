import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../context/SimpleAuthContext';

const AdminDebugger = () => {
  const { user, isAuthenticated } = useAuth();

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
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AdminDebugger; 