import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

const BasicTest: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();

  const handleTest = () => {
    Alert.alert(
      'App Test',
      `Auth: ${isAuthenticated ? 'YES' : 'NO'}\nUser: ${user?.fullName || 'None'}`,
      [{ text: 'OK' }]
    );
  };

  const handleSimpleLogout = async () => {
    try {
      await logout();
      Alert.alert('Success', 'Logged out');
    } catch (error) {
      Alert.alert('Error', 'Logout failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>App Status</Text>
      <Text style={styles.info}>User: {user?.fullName || 'Loading...'}</Text>
      <Text style={styles.info}>Email: {user?.email || 'N/A'}</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleTest}>
        <Text style={styles.buttonText}>Test App</Text>
      </TouchableOpacity>
      
      {isAuthenticated && (
        <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleSimpleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e3f2fd',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1976d2',
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    marginBottom: 5,
    color: '#424242',
  },
  button: {
    backgroundColor: '#2196f3',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default BasicTest; 