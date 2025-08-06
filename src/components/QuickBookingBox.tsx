import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../context/SimpleAuthContext';

const QuickBookingBox: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [location, setLocation] = useState('');

  const handleBookNowPress = () => {
    if (!isAuthenticated) {
      Alert.alert(
        t('auth.loginRequired'),
        t('auth.loginRequiredMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { 
            text: t('auth.login'), 
            onPress: () => navigation.navigate('Login' as never)
          }
        ]
      );
      return;
    }
    setShowModal(true);
  };

  const handleQuickBook = () => {
    // For now, just close modal and could navigate to a search page later
    // Or integrate with the booking flow
    setShowModal(false);
    // Could navigate to a search results screen or booking flow
    console.log('Quick booking:', { startDate, endDate, location });
  };

  return (
    <>
      <View style={styles.quickBookBox}>
        <Text style={styles.quickBookTitle}>{t('home.quickBooking')}</Text>
        <Text style={styles.quickBookSubtitle}>{t('home.selectDates')}</Text>
        
        <TouchableOpacity style={styles.quickBookButton} onPress={handleBookNowPress}>
          <Text style={styles.quickBookButtonText}>{t('home.bookNow')}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.cancelButton}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('home.quickBooking')}</Text>
            <TouchableOpacity onPress={handleQuickBook}>
              <Text style={styles.doneButton}>{t('common.confirm')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>{t('search.location')}</Text>
              <TextInput
                style={styles.locationInput}
                placeholder={t('search.location')}
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>{t('booking.dateTime')}</Text>
              
              <TouchableOpacity 
                style={styles.dateButton} 
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateLabel}>{t('booking.startDate')}</Text>
                <Text style={styles.dateValue}>{startDate.toLocaleDateString('vi-VN')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.dateButton} 
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateLabel}>{t('booking.endDate')}</Text>
                <Text style={styles.dateValue}>{endDate.toLocaleDateString('vi-VN')}</Text>
              </TouchableOpacity>

              <View style={styles.durationInfo}>
                <Text style={styles.durationText}>
                  {t('booking.duration')}: {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} {t('common.days')}
                </Text>
              </View>
            </View>
          </View>

          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartDatePicker(false);
                if (selectedDate) {
                  setStartDate(selectedDate);
                  if (selectedDate >= endDate) {
                    setEndDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000));
                  }
                }
              }}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              minimumDate={startDate}
              onChange={(event, selectedDate) => {
                setShowEndDatePicker(false);
                if (selectedDate) {
                  setEndDate(selectedDate);
                }
              }}
            />
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  quickBookBox: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  quickBookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  quickBookSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 15,
  },
  quickBookButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  quickBookButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  doneButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputSection: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  locationInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
  },
  dateButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  dateLabel: {
    fontSize: 16,
    color: '#333',
  },
  dateValue: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  durationInfo: {
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    marginTop: 10,
  },
  durationText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default QuickBookingBox;
