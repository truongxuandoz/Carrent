import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { getSafeImageSource } from '../utils/placeholderImage';

type HistoryScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface BookingHistoryItem {
  id: string;
  bikeName: string;
  bikeImage: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'completed' | 'active' | 'cancelled';
  location: string;
  rating?: number;
}

const HistoryScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<HistoryScreenNavigationProp>();
  const [selectedTab, setSelectedTab] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  const mockBookings: BookingHistoryItem[] = [
    {
      id: '1',
      bikeName: 'Honda Vision 2023',
      bikeImage: getSafeImageSource(null, 'bike').uri,
      startDate: '2024-01-15',
      endDate: '2024-01-17',
      totalPrice: 450000,
      status: 'completed',
      location: 'Quận 1, TP.HCM',
      rating: 5,
    },
    {
      id: '2',
      bikeName: 'Yamaha Grande Hybrid',
      bikeImage: getSafeImageSource(null, 'bike').uri,
      startDate: '2024-01-20',
      endDate: '2024-01-22',
      totalPrice: 540000,
      status: 'active',
      location: 'Quận 3, TP.HCM',
    },
    {
      id: '3',
      bikeName: 'SYM Attila Elizabeth',
      bikeImage: getSafeImageSource(null, 'bike').uri,
      startDate: '2024-01-10',
      endDate: '2024-01-12',
      totalPrice: 600000,
      status: 'cancelled',
      location: 'Quận 7, TP.HCM',
    },
    {
      id: '4',
      bikeName: 'Honda Air Blade',
      bikeImage: getSafeImageSource(null, 'bike').uri,
      startDate: '2024-01-05',
      endDate: '2024-01-07',
      totalPrice: 400000,
      status: 'completed',
      location: 'Quận 2, TP.HCM',
      rating: 4,
    },
  ];

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

  const getTabText = (tab: string) => {
    switch (tab) {
      case 'all':
        return t('booking.allBookings');
      case 'active':
        return t('booking.activeBookings');
      case 'completed':
        return t('booking.completedBookings');
      case 'cancelled':
        return t('booking.cancelledBookings');
      default:
        return tab;
    }
  };

  const filteredBookings = mockBookings.filter(booking => {
    if (selectedTab === 'all') return true;
    return booking.status === selectedTab;
  });

  const handleBookAgain = (item: BookingHistoryItem) => {
    // Navigate to booking with pre-filled bike info
    navigation.navigate('BookingDetail', { 
      bikeId: item.id,
      isRebooking: true 
    });
  };

  const handleViewDetails = (item: BookingHistoryItem) => {
    // Navigate to read-only booking detail view
    navigation.navigate('BookingDetailView', { bookingId: item.id });
  };

  const renderBookingItem = ({ item }: { item: BookingHistoryItem }) => (
    <View style={styles.bookingCard}>
      <Image source={{ uri: item.bikeImage }} style={styles.bikeImage} />
      <View style={styles.bookingInfo}>
        <View style={styles.bookingHeader}>
          <Text style={styles.bikeName}>{item.bikeName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        
        <Text style={styles.location}>📍 {item.location}</Text>
        <Text style={styles.dateText}>
          {new Date(item.startDate).toLocaleDateString('vi-VN')} - {new Date(item.endDate).toLocaleDateString('vi-VN')}
        </Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>{item.totalPrice.toLocaleString()} VND</Text>
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>⭐ {item.rating}</Text>
            </View>
          )}
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {item.status === 'active' && (
            <>
              <TouchableOpacity style={[styles.actionButton, styles.trackButton]}>
                <Text style={styles.actionButtonText}>{t('booking.trackBike')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.viewDetailsButton]}
                onPress={() => handleViewDetails(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.viewDetailsButtonText}>{t('booking.viewDetails')}</Text>
              </TouchableOpacity>
            </>
          )}
          
          {item.status === 'completed' && (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.bookAgainButton]}
                onPress={() => handleBookAgain(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.bookAgainButtonText}>{t('booking.bookAgain')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.viewDetailsButton]}
                onPress={() => handleViewDetails(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.viewDetailsButtonText}>{t('booking.viewDetails')}</Text>
              </TouchableOpacity>
            </>
          )}
          
          {item.status === 'cancelled' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.viewDetailsButton]}
              onPress={() => handleViewDetails(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.viewDetailsButtonText}>{t('booking.viewDetails')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('booking.bookingHistory')}</Text>
      </View>

      {/* Tab Filter */}
      <View style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.tabScrollContent}
        >
          {['all', 'active', 'completed', 'cancelled'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                selectedTab === tab && styles.tabButtonActive,
              ]}
              onPress={() => setSelectedTab(tab as any)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  selectedTab === tab && styles.tabButtonTextActive,
                ]}
              >
                {getTabText(tab)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Booking List */}
      <FlatList
        data={filteredBookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>{t('booking.noBookings')}</Text>
            <Text style={styles.emptyText}>{t('booking.noBookingsDesc')}</Text>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => navigation.navigate('MainTabs')}
              activeOpacity={0.8}
            >
              <Text style={styles.exploreButtonText}>{t('booking.exploreNow')}</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabScrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  tabButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
    elevation: 3,
    shadowOpacity: 0.3,
  },
  tabButtonText: {
    fontSize: 13,
    color: '#495057',
    fontWeight: '600',
    textAlign: 'center',
  },
  tabButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 20,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
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
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#f0f0f0',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  bikeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  actionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  trackButton: {
    backgroundColor: '#007AFF',
  },
  bookAgainButton: {
    backgroundColor: '#28a745',
  },
  viewDetailsButton: {
    backgroundColor: '#6c757d',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  bookAgainButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  viewDetailsButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 20,
  },
  exploreButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default HistoryScreen; 