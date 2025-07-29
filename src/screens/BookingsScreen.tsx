import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

const BookingsScreen: React.FC = () => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('booking.bookingHistory')}</Text>
      <Text style={styles.subtitle}>Booking functionality coming soon...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

export default BookingsScreen; 