import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { 
  getAllBookings, 
  updateBookingStatus, 
  BookingManagement 
} from '../../services/adminService';

const BookingManagementScreen = () => {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<BookingManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingManagement | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCancellationModal, setShowCancellationModal] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async (page = 1, status = '') => {
    try {
      if (page === 1) setLoading(true);
      
      const response = await getAllBookings(page, 20, status);
      
      if (page === 1) {
        setBookings(response.bookings);
      } else {
        setBookings(prev => [...prev, ...response.bookings]);
      }
      
      setHasMore(response.hasMore);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    loadBookings(1, statusFilter);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      loadBookings(currentPage + 1, statusFilter);
    }
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    loadBookings(1, status);
  };

  const handleStatusUpdate = async (
    bookingId: string, 
    newStatus: BookingManagement['status'], 
    reason?: string
  ) => {
    try {
      await updateBookingStatus(bookingId, newStatus, reason);
      
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus, cancellationReason: reason || booking.cancellationReason }
          : booking
      ));
      
      Alert.alert('Success', `Booking status updated to ${newStatus}`);
      setShowBookingModal(false);
      setShowCancellationModal(false);
      setCancellationReason('');
    } catch (error) {
      console.error('Error updating booking status:', error);
      Alert.alert('Error', 'Failed to update booking status');
    }
  };

  const handleCancelBooking = () => {
    if (!cancellationReason.trim()) {
      Alert.alert('Error', 'Please provide a cancellation reason');
      return;
    }
    
    if (selectedBooking) {
      handleStatusUpdate(selectedBooking.id, 'cancelled', cancellationReason.trim());
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F39C12';
      case 'confirmed': return '#3498DB';
      case 'active': return '#27AE60';
      case 'completed': return '#2ECC71';
      case 'cancelled': return '#E74C3C';
      default: return '#95A5A6';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F39C12';
      case 'paid': return '#27AE60';
      case 'refunded': return '#3498DB';
      case 'failed': return '#E74C3C';
      default: return '#95A5A6';
    }
  };

  const renderBookingItem = ({ item }: { item: BookingManagement }) => (
    <TouchableOpacity 
      style={styles.bookingCard}
      onPress={() => {
        setSelectedBooking(item);
        setShowBookingModal(true);
      }}
    >
      <View style={styles.bookingHeader}>
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingId}>#{item.id.slice(-8).toUpperCase()}</Text>
          <Text style={styles.userName}>{item.userName}</Text>
          <Text style={styles.bikeModel}>{item.bikeModel} - {item.bikeLicensePlate}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          <View style={[styles.paymentBadge, { backgroundColor: getPaymentStatusColor(item.paymentStatus) }]}>
            <Text style={styles.paymentText}>{item.paymentStatus}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#666" />
          <Text style={styles.detailText}>
            {formatDate(item.startDate)} - {formatDate(item.endDate)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color="#666" />
          <Text style={styles.detailText}>{item.totalDays} days</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash" size={16} color="#666" />
          <Text style={styles.detailText}>{formatCurrency(item.totalAmount)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderStatusFilters = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
      {['', 'pending', 'confirmed', 'active', 'completed', 'cancelled'].map(status => (
        <TouchableOpacity
          key={status}
          style={[
            styles.filterButton,
            statusFilter === status && styles.activeFilterButton
          ]}
          onPress={() => handleStatusFilter(status)}
        >
          <Text style={[
            styles.filterText,
            statusFilter === status && styles.activeFilterText
          ]}>
            {status || 'All'}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderBookingModal = () => (
    <Modal
      visible={showBookingModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Booking Details</Text>
          <TouchableOpacity 
            onPress={() => setShowBookingModal(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {selectedBooking && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Booking Information</Text>
              
              <View style={styles.bookingDetail}>
                <Text style={styles.detailLabel}>Booking ID</Text>
                <Text style={styles.detailValue}>#{selectedBooking.id.slice(-8).toUpperCase()}</Text>
              </View>
              
              <View style={styles.bookingDetail}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>{formatDateTime(selectedBooking.createdAt)}</Text>
              </View>
              
              <View style={styles.bookingDetail}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedBooking.status) }]}>
                  <Text style={styles.statusText}>{selectedBooking.status}</Text>
                </View>
              </View>

              <View style={styles.bookingDetail}>
                <Text style={styles.detailLabel}>Payment Status</Text>
                <View style={[styles.paymentBadge, { backgroundColor: getPaymentStatusColor(selectedBooking.paymentStatus) }]}>
                  <Text style={styles.paymentText}>{selectedBooking.paymentStatus}</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Information</Text>
              
              <View style={styles.bookingDetail}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>{selectedBooking.userName}</Text>
              </View>
              
              <View style={styles.bookingDetail}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{selectedBooking.userEmail}</Text>
              </View>
              
              <View style={styles.bookingDetail}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{selectedBooking.userPhone}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bike Information</Text>
              
              <View style={styles.bookingDetail}>
                <Text style={styles.detailLabel}>Model</Text>
                <Text style={styles.detailValue}>{selectedBooking.bikeModel}</Text>
              </View>
              
              <View style={styles.bookingDetail}>
                <Text style={styles.detailLabel}>License Plate</Text>
                <Text style={styles.detailValue}>{selectedBooking.bikeLicensePlate}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rental Details</Text>
              
              <View style={styles.bookingDetail}>
                <Text style={styles.detailLabel}>Start Date</Text>
                <Text style={styles.detailValue}>{formatDate(selectedBooking.startDate)}</Text>
              </View>
              
              <View style={styles.bookingDetail}>
                <Text style={styles.detailLabel}>End Date</Text>
                <Text style={styles.detailValue}>{formatDate(selectedBooking.endDate)}</Text>
              </View>
              
              <View style={styles.bookingDetail}>
                <Text style={styles.detailLabel}>Total Days</Text>
                <Text style={styles.detailValue}>{selectedBooking.totalDays} days</Text>
              </View>
              
              <View style={styles.bookingDetail}>
                <Text style={styles.detailLabel}>Price per Day</Text>
                <Text style={styles.detailValue}>{formatCurrency(selectedBooking.pricePerDay)}</Text>
              </View>
              
              <View style={styles.bookingDetail}>
                <Text style={styles.detailLabel}>Total Amount</Text>
                <Text style={[styles.detailValue, styles.totalAmount]}>{formatCurrency(selectedBooking.totalAmount)}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Locations</Text>
              
              <View style={styles.bookingDetail}>
                <Text style={styles.detailLabel}>Pickup Location</Text>
                <Text style={styles.detailValue}>{selectedBooking.pickupLocation}</Text>
              </View>
              
              <View style={styles.bookingDetail}>
                <Text style={styles.detailLabel}>Return Location</Text>
                <Text style={styles.detailValue}>{selectedBooking.returnLocation}</Text>
              </View>
            </View>

            {selectedBooking.notes && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.notesText}>{selectedBooking.notes}</Text>
              </View>
            )}

            {selectedBooking.cancellationReason && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cancellation Reason</Text>
                <Text style={styles.notesText}>{selectedBooking.cancellationReason}</Text>
              </View>
            )}

            <View style={styles.actionButtons}>
              {selectedBooking.status === 'pending' && (
                <>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#27AE60' }]}
                    onPress={() => handleStatusUpdate(selectedBooking.id, 'confirmed')}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Confirm</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#E74C3C' }]}
                    onPress={() => setShowCancellationModal(true)}
                  >
                    <Ionicons name="close-circle" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}

              {selectedBooking.status === 'confirmed' && (
                <>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#3498DB' }]}
                    onPress={() => handleStatusUpdate(selectedBooking.id, 'active')}
                  >
                    <Ionicons name="play-circle" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Start Rental</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#E74C3C' }]}
                    onPress={() => setShowCancellationModal(true)}
                  >
                    <Ionicons name="close-circle" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}

              {selectedBooking.status === 'active' && (
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#2ECC71' }]}
                  onPress={() => handleStatusUpdate(selectedBooking.id, 'completed')}
                >
                  <Ionicons name="checkmark-done-circle" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Complete</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  const renderCancellationModal = () => (
    <Modal
      visible={showCancellationModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Cancel Booking</Text>
          <TouchableOpacity 
            onPress={() => setShowCancellationModal(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <Text style={styles.inputLabel}>Cancellation Reason *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={cancellationReason}
            onChangeText={setCancellationReason}
            placeholder="Please provide a reason for cancellation"
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancelBooking}
          >
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Booking Management</Text>
      </View>

      {renderStatusFilters()}

      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
      />

      {renderBookingModal()}
      {renderCancellationModal()}
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 10,
  },
  activeFilterButton: {
    backgroundColor: '#4ECDC4',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '600',
  },
  bookingCard: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 5,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  bikeModel: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginBottom: 5,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  paymentText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  bookingDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  bookingDetail: {
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 18,
    color: '#27AE60',
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 5,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  cancelButton: {
    backgroundColor: '#E74C3C',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BookingManagementScreen; 