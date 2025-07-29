import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface BookingParams {
  bikeId?: string;
  bike?: {
    id: string;
    name: string;
    brand: string;
    pricePerDay: number;
    pricePerHour: number;
    image: string;
    deposit: number;
    insurance: number;
  };
}

const BookingDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as BookingParams;

  // Mock bike data if not passed
  const bike = params?.bike || {
    id: '1',
    name: 'Honda Vision',
    brand: 'Honda',
    pricePerDay: 150000,
    pricePerHour: 20000,
    image: 'https://via.placeholder.com/150',
    deposit: 500000,
    insurance: 50000,
  };

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [rentalType, setRentalType] = useState<'daily' | 'hourly'>('daily');

  const calculateTotal = () => {
    const hours = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
    const days = Math.ceil(hours / 24);
    
    let rentalPrice = 0;
    if (rentalType === 'daily') {
      rentalPrice = bike.pricePerDay * days;
    } else {
      rentalPrice = bike.pricePerHour * hours;
    }

    const deliveryFee = deliveryType === 'delivery' ? 50000 : 0;
    return {
      rentalPrice,
      deposit: bike.deposit,
      insurance: bike.insurance,
      deliveryFee,
      total: rentalPrice + bike.deposit + bike.insurance + deliveryFee,
      duration: rentalType === 'daily' ? `${days} ${t('common.days')}` : `${hours} ${t('common.hours')}`,
    };
  };

  const handleBooking = () => {
    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      Alert.alert(t('common.error'), t('booking.deliveryAddressRequired'));
      return;
    }

    const booking = {
      bikeId: bike.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      deliveryType,
      deliveryAddress,
      customerNotes,
      rentalType,
      ...calculateTotal(),
    };

    Alert.alert(
      t('booking.confirmBooking'),
      `${t('booking.totalPrice')}: ${calculateTotal().total.toLocaleString()} VND`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => {
            // TODO: API call to create booking
            Alert.alert(t('common.success'), t('booking.bookingConfirmed'));
            navigation.goBack();
          },
        },
      ]
    );
  };

  const total = calculateTotal();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}> {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('booking.newBooking')}</Text>
      </View>

      {/* Bike Info */}
      <View style={styles.bikeInfo}>
        <Text style={styles.bikeName}>{bike.name}</Text>
        <Text style={styles.bikeBrand}>{bike.brand}</Text>
        <View style={styles.priceInfo}>
          <Text style={styles.priceText}>
            {bike.pricePerDay.toLocaleString()} VND/{t('common.day')}  {bike.pricePerHour.toLocaleString()} VND/{t('common.hour')}
          </Text>
        </View>
      </View>

      {/* Rental Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('booking.rentalType')}</Text>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, rentalType === 'daily' && styles.typeButtonActive]}
            onPress={() => setRentalType('daily')}
          >
            <Text style={[styles.typeButtonText, rentalType === 'daily' && styles.typeButtonTextActive]}>
              {t('booking.dailyRental')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, rentalType === 'hourly' && styles.typeButtonActive]}
            onPress={() => setRentalType('hourly')}
          >
            <Text style={[styles.typeButtonText, rentalType === 'hourly' && styles.typeButtonTextActive]}>
              {t('booking.hourlyRental')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date & Time Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('booking.dateTime')}</Text>
        
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartDatePicker(true)}>
          <Text style={styles.dateLabel}>{t('booking.startDate')}</Text>
          <Text style={styles.dateValue}>{startDate.toLocaleDateString('vi-VN')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndDatePicker(true)}>
          <Text style={styles.dateLabel}>{t('booking.endDate')}</Text>
          <Text style={styles.dateValue}>{endDate.toLocaleDateString('vi-VN')}</Text>
        </TouchableOpacity>

        <View style={styles.durationInfo}>
          <Text style={styles.durationText}>
            {t('booking.duration')}: {total.duration}
          </Text>
        </View>
      </View>

      {/* Delivery Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('booking.deliveryOptions')}</Text>
        
        <TouchableOpacity
          style={[styles.deliveryOption, deliveryType === 'pickup' && styles.deliveryOptionActive]}
          onPress={() => setDeliveryType('pickup')}
        >
          <Text style={[styles.deliveryOptionText, deliveryType === 'pickup' && styles.deliveryOptionTextActive]}>
             {t('booking.pickupAtLocation')}
          </Text>
          <Text style={styles.deliveryOptionDesc}>{t('booking.pickupDesc')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deliveryOption, deliveryType === 'delivery' && styles.deliveryOptionActive]}
          onPress={() => setDeliveryType('delivery')}
        >
          <Text style={[styles.deliveryOptionText, deliveryType === 'delivery' && styles.deliveryOptionTextActive]}>
             {t('booking.deliveryToLocation')}
          </Text>
          <Text style={styles.deliveryOptionDesc}>{t('booking.deliveryDesc')}</Text>
        </TouchableOpacity>

        {deliveryType === 'delivery' && (
          <TextInput
            style={styles.addressInput}
            placeholder={t('booking.enterDeliveryAddress')}
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            multiline
          />
        )}
      </View>

      {/* Customer Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('booking.customerNotes')}</Text>
        <TextInput
          style={styles.notesInput}
          placeholder={t('booking.notesPlaceholder')}
          value={customerNotes}
          onChangeText={setCustomerNotes}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Price Breakdown */}
      <View style={styles.priceBreakdown}>
        <Text style={styles.priceBreakdownTitle}>{t('booking.priceBreakdown')}</Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{t('booking.rentalPrice')} ({total.duration})</Text>
          <Text style={styles.priceValue}>{total.rentalPrice.toLocaleString()} VND</Text>
        </View>
        
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{t('booking.deposit')}</Text>
          <Text style={styles.priceValue}>{total.deposit.toLocaleString()} VND</Text>
        </View>
        
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{t('booking.insurance')}</Text>
          <Text style={styles.priceValue}>{total.insurance.toLocaleString()} VND</Text>
        </View>
        
        {deliveryType === 'delivery' && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t('booking.deliveryFee')}</Text>
            <Text style={styles.priceValue}>{total.deliveryFee.toLocaleString()} VND</Text>
          </View>
        )}
        
        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>{t('booking.totalPrice')}</Text>
          <Text style={styles.totalValue}>{total.total.toLocaleString()} VND</Text>
        </View>
      </View>

      {/* Book Button */}
      <TouchableOpacity style={styles.bookButton} onPress={handleBooking}>
        <Text style={styles.bookButtonText}>{t('booking.confirmBooking')}</Text>
      </TouchableOpacity>

      {/* Date Pickers */}
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  bikeInfo: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  bikeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  bikeBrand: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  priceInfo: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#333',
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateButton: {
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
    padding: 10,
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
  deliveryOption: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  deliveryOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  deliveryOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  deliveryOptionTextActive: {
    color: '#007AFF',
  },
  deliveryOptionDesc: {
    fontSize: 14,
    color: '#666',
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  priceBreakdown: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 20,
  },
  priceBreakdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#333',
  },
  priceValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 10,
    paddingTop: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default BookingDetailScreen;
