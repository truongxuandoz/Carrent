import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface BookingDetailViewParams {
  bookingId: string;
}

interface BookingDetail {
  id: string;
  bikeName: string;
  bikeImage: string;
  bikeModel: string;
  licensePlate: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  rentalType: 'daily' | 'hourly';
  duration: number;
  pickupType: 'pickup' | 'delivery';
  pickupLocation?: string;
  deliveryAddress?: string;
  customerNotes?: string;
  pricePerDay?: number;
  pricePerHour?: number;
  subtotal: number;
  deposit: number;
  insurance: number;
  deliveryFee: number;
  totalPrice: number;
  status: 'completed' | 'active' | 'cancelled';
  paymentMethod: string;
  paymentStatus: string;
  bookingDate: string;
  rating?: number;
  review?: string;
}

const BookingDetailViewScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { bookingId } = route.params as BookingDetailViewParams;

  // Mock booking detail data
  const bookingDetail: BookingDetail = {
    id: bookingId,
    bikeName: 'Honda Vision 2023',
    bikeImage: 'https://via.placeholder.com/300x200',
    bikeModel: 'Honda Vision 2023',
    licensePlate: '59H1-12345',
    startDate: '2024-01-15',
    endDate: '2024-01-17',
    startTime: '09:00',
    endTime: '18:00',
    rentalType: 'daily',
    duration: 2,
    pickupType: 'delivery',
    deliveryAddress: '123 Nguyễn Văn Linh, Quận 7, TP.HCM',
    customerNotes: 'Giao xe vào buổi sáng. Liên hệ trước 30 phút.',
    pricePerDay: 150000,
    subtotal: 300000,
    deposit: 300000,
    insurance: 50000,
    deliveryFee: 30000,
    totalPrice: 680000,
    status: 'completed',
    paymentMethod: 'VNPay',
    paymentStatus: 'Đã thanh toán',
    bookingDate: '2024-01-12',
    rating: 5,
    review: 'Xe chạy tốt, chủ xe thân thiện!'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#28a745';
      case 'active':
        return '#007AFF';
      case 'cancelled':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return t('booking.completedBookings');
      case 'active':
        return t('booking.activeBookings');
      case 'cancelled':
        return t('booking.cancelledBookings');
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const renderInfoRow = (label: string, value: string, icon?: keyof typeof Ionicons.glyphMap) => (
    <View style={styles.infoRow}>
      {icon && <Ionicons name={icon} size={20} color="#666" style={styles.infoIcon} />}
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  const renderPriceRow = (label: string, amount: number, isTotal = false) => (
    <View style={[styles.priceRow, isTotal && styles.totalPriceRow]}>
      <Text style={[styles.priceLabel, isTotal && styles.totalPriceLabel]}>{label}</Text>
      <Text style={[styles.priceValue, isTotal && styles.totalPriceValue]}>
        {amount.toLocaleString()} VND
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('booking.bookingDetails')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(bookingDetail.status) }]}>
            <Text style={styles.statusText}>{getStatusText(bookingDetail.status)}</Text>
          </View>
        </View>

        {/* Bike Info */}
        <View style={styles.section}>
          <Image source={{ uri: bookingDetail.bikeImage }} style={styles.bikeImage} />
          <View style={styles.bikeInfo}>
            <Text style={styles.bikeName}>{bookingDetail.bikeName}</Text>
            <Text style={styles.licensePlate}>Biển số: {bookingDetail.licensePlate}</Text>
          </View>
        </View>

        {/* Booking Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking.bookingInformation')}</Text>
          
          {renderInfoRow(
            t('booking.bookingDate'),
            formatDate(bookingDetail.bookingDate),
            'calendar-outline'
          )}
          
          {renderInfoRow(
            t('booking.rentalPeriod'),
            `${formatDate(bookingDetail.startDate)} - ${formatDate(bookingDetail.endDate)}`,
            'time-outline'
          )}
          
          {renderInfoRow(
            t('booking.rentalTime'),
            `${formatTime(bookingDetail.startTime)} - ${formatTime(bookingDetail.endTime)}`,
            'time'
          )}
          
          {renderInfoRow(
            t('booking.rentalDuration'),
            `${bookingDetail.duration} ${bookingDetail.rentalType === 'daily' ? t('booking.days') : t('booking.hours')}`,
            'hourglass-outline'
          )}
        </View>

        {/* Pickup/Delivery Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking.deliveryInformation')}</Text>
          
          {renderInfoRow(
            t('booking.deliveryType'),
            bookingDetail.pickupType === 'pickup' ? t('booking.pickupAtLocation') : t('booking.deliveryToLocation'),
            'location-outline'
          )}
          
          {bookingDetail.deliveryAddress && renderInfoRow(
            t('booking.deliveryAddress'),
            bookingDetail.deliveryAddress,
            'home-outline'
          )}
          
          {bookingDetail.customerNotes && renderInfoRow(
            t('booking.customerNotes'),
            bookingDetail.customerNotes,
            'chatbubble-outline'
          )}
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking.paymentInformation')}</Text>
          
          {renderInfoRow(
            t('payment.paymentMethod'),
            bookingDetail.paymentMethod,
            'card-outline'
          )}
          
          {renderInfoRow(
            t('payment.paymentStatus'),
            bookingDetail.paymentStatus,
            'checkmark-circle-outline'
          )}
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking.priceBreakdown')}</Text>
          
          <View style={styles.priceContainer}>
            {renderPriceRow(
              bookingDetail.rentalType === 'daily' ? t('booking.pricePerDay') : t('booking.pricePerHour'),
              bookingDetail.subtotal
            )}
            {renderPriceRow(t('booking.deposit'), bookingDetail.deposit)}
            {renderPriceRow(t('booking.insurance'), bookingDetail.insurance)}
            {bookingDetail.deliveryFee > 0 && renderPriceRow(t('booking.deliveryFee'), bookingDetail.deliveryFee)}
            
            <View style={styles.divider} />
            {renderPriceRow(t('booking.totalAmount'), bookingDetail.totalPrice, true)}
          </View>
        </View>

        {/* Rating & Review */}
        {bookingDetail.status === 'completed' && bookingDetail.rating && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('booking.ratingAndReview')}</Text>
            
            <View style={styles.ratingContainer}>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= (bookingDetail.rating || 0) ? 'star' : 'star-outline'}
                    size={24}
                    color="#FFD700"
                  />
                ))}
                <Text style={styles.ratingText}>({bookingDetail.rating}/5)</Text>
              </View>
              
              {bookingDetail.review && (
                <Text style={styles.reviewText}>{bookingDetail.review}</Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bikeImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
  },
  bikeInfo: {
    alignItems: 'center',
  },
  bikeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  licensePlate: {
    fontSize: 16,
    color: '#666',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  priceContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalPriceRow: {
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalPriceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalPriceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#dee2e6',
    marginVertical: 8,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
    fontWeight: '500',
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default BookingDetailViewScreen; 