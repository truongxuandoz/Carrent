import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';

const LoadingScreen: React.FC = () => {
  const { t } = useTranslation();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Animated dots
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🏍️</Text>
          <Text style={styles.appName}>CarRent</Text>
        </View>
        
        <ActivityIndicator size="large" color="#007AFF" style={styles.spinner} />
        
        <Text style={styles.text}>
          {t('common.loading', 'Loading')}{dots}
        </Text>
        
        <Text style={styles.subText}>
          {t('common.pleaseWait', 'Please wait...')}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  content: {
    alignItems: 'center',
    padding: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 60,
    marginBottom: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  spinner: {
    marginBottom: 20,
  },
  text: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
    marginBottom: 8,
    minHeight: 25,
  },
  subText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default LoadingScreen; 