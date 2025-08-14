import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/SimpleAuthContext';

export const QuickAuthDebug: React.FC = () => {
  const { user, session, isLoading, operationLoading, isAuthenticated } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Quick Auth Debug</Text>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.section}>LOADING STATES:</Text>
        <Text style={styles.item}>isLoading: {isLoading ? '✅ true' : '❌ false'}</Text>
        <Text style={styles.item}>operationLoading: {operationLoading ? '✅ true' : '❌ false'}</Text>
        <Text style={styles.item}>isAuthenticated: {isAuthenticated ? '✅ true' : '❌ false'}</Text>
        
        <Text style={styles.section}>SESSION:</Text>
        <Text style={styles.item}>Session exists: {session ? '✅ yes' : '❌ no'}</Text>
        {session && (
          <>
            <Text style={styles.item}>Email: {session.user?.email || 'undefined'}</Text>
            <Text style={styles.item}>ID: {session.user?.id || 'undefined'}</Text>
          </>
        )}
        
        <Text style={styles.section}>USER PROFILE:</Text>
        <Text style={styles.item}>User exists: {user ? '✅ yes' : '❌ no'}</Text>
        {user && (
          <>
            <Text style={styles.item}>Email: {user.email}</Text>
            <Text style={styles.item}>Name: {user.fullName}</Text>
            <Text style={styles.item}>Role: {user.role}</Text>
            <Text style={styles.item}>Active: {user.isActive ? '✅ yes' : '❌ no'}</Text>
          </>
        )}
        
        <Text style={styles.section}>SHOULD SHOW:</Text>
        <Text style={styles.item}>
          Expected: {!isLoading && !operationLoading && isAuthenticated && user ? 'HOME SCREEN' : 'LOADING SCREEN'}
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    width: 300,
    maxHeight: 400,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 8,
    padding: 10,
    zIndex: 1000,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scrollView: {
    maxHeight: 350,
  },
  section: {
    color: '#00ff00',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  item: {
    color: '#fff',
    fontSize: 10,
    marginBottom: 2,
    fontFamily: 'monospace',
  },
}); 