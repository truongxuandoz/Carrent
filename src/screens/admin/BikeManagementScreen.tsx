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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { 
  getAllBikes, 
  createBike, 
  updateBike, 
  deleteBike, 
  BikeManagement 
} from '../../services/adminService';

const BikeManagementScreen = () => {
  const { t } = useTranslation();
  const [bikes, setBikes] = useState<BikeManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedBike, setSelectedBike] = useState<BikeManagement | null>(null);
  const [showBikeModal, setShowBikeModal] = useState(false);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Form states for add/edit
  const [formData, setFormData] = useState({
    model: '',
    brand: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    status: 'available' as 'available' | 'rented' | 'maintenance' | 'retired',
    pricePerDay: 0,
    location: '',
    fuelType: 'gasoline',
    transmission: 'manual',
    engineCapacity: 150,
    features: [] as string[],
    condition: 'excellent' as 'excellent' | 'good' | 'fair' | 'poor',
    images: [] as string[],
    lastMaintenance: '',
    nextMaintenance: '',
  });

  useEffect(() => {
    loadBikes();
  }, []);

  const loadBikes = async (page = 1, status = '') => {
    try {
      console.log('🔄 BikeManagementScreen loading bikes - page:', page, 'status:', status);
      if (page === 1) setLoading(true);
      
      const response = await getAllBikes(page, 20, status);
      console.log('✅ BikeManagementScreen got bikes:', response.bikes.length, 'total:', response.total);
      
      if (page === 1) {
        setBikes(response.bikes);
      } else {
        setBikes(prev => [...prev, ...response.bikes]);
      }
      
      setHasMore(response.hasMore);
      setCurrentPage(page);
    } catch (error) {
      console.error('❌ BikeManagementScreen error loading bikes:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      Alert.alert(
        'Error Loading Bikes', 
        'Failed to load bikes. Please check if sample data exists in database.\n\nError: ' + (error instanceof Error ? error.message : 'Unknown error'),
        [
          { text: 'OK' },
          { text: 'Retry', onPress: () => loadBikes(page, status) }
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    loadBikes(1, statusFilter);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      loadBikes(currentPage + 1, statusFilter);
    }
  };

  const handleStatusFilter = (status: string) => {
    console.log('🔄 Filter button clicked:', status);
    setStatusFilter(status);
    setCurrentPage(1);
    loadBikes(1, status);
  };

  const resetForm = () => {
    setFormData({
      model: '',
      brand: '',
      year: new Date().getFullYear(),
      licensePlate: '',
      status: 'available',
      pricePerDay: 0,
      location: '',
      fuelType: 'gasoline',
      transmission: 'manual',
      engineCapacity: 150,
      features: [],
      condition: 'excellent',
      images: [],
      lastMaintenance: '',
      nextMaintenance: '',
    });
  };

  const handleAddBike = () => {
    resetForm();
    setIsEditing(false);
    setShowAddEditModal(true);
  };

  const handleEditBike = (bike: BikeManagement) => {
    setFormData({
      model: bike.model,
      brand: bike.brand,
      year: bike.year,
      licensePlate: bike.licensePlate,
      status: bike.status,
      pricePerDay: bike.pricePerDay,
      location: bike.location,
      fuelType: bike.fuelType,
      transmission: bike.transmission,
      engineCapacity: bike.engineCapacity,
      features: bike.features,
      condition: bike.condition,
      images: bike.images,
      lastMaintenance: bike.lastMaintenance || '',
      nextMaintenance: bike.nextMaintenance || '',
    });
    setSelectedBike(bike);
    setIsEditing(true);
    setShowBikeModal(false);
    setShowAddEditModal(true);
  };

  const handleSaveBike = async () => {
    if (!formData.model.trim() || !formData.brand.trim() || !formData.licensePlate.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      if (isEditing && selectedBike) {
        await updateBike(selectedBike.id, formData);
        setBikes(prev => prev.map(bike => 
          bike.id === selectedBike.id 
            ? { ...bike, ...formData }
            : bike
        ));
        Alert.alert('Success', 'Bike updated successfully');
      } else {
        const newBike = await createBike(formData);
        setBikes(prev => [newBike, ...prev]);
        Alert.alert('Success', 'Bike added successfully');
      }
      setShowAddEditModal(false);
    } catch (error) {
      console.error('Error saving bike:', error);
      Alert.alert('Error', 'Failed to save bike');
    }
  };

  const handleDeleteBike = async (bikeId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this bike? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBike(bikeId);
              setBikes(prev => prev.filter(bike => bike.id !== bikeId));
              Alert.alert('Success', 'Bike deleted successfully');
              setShowBikeModal(false);
            } catch (error) {
              console.error('Error deleting bike:', error);
              Alert.alert('Error', 'Failed to delete bike');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#27AE60';
      case 'rented': return '#F39C12';
      case 'maintenance': return '#E74C3C';
      case 'retired': return '#95A5A6';
      default: return '#95A5A6';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return '#27AE60';
      case 'good': return '#2ECC71';
      case 'fair': return '#F39C12';
      case 'poor': return '#E74C3C';
      default: return '#95A5A6';
    }
  };

  const renderBikeItem = ({ item }: { item: BikeManagement }) => (
    <TouchableOpacity 
      style={styles.bikeCard}
      onPress={() => {
        setSelectedBike(item);
        setShowBikeModal(true);
      }}
    >
      <View style={styles.bikeHeader}>
        <View style={styles.bikeInfo}>
          <Text style={styles.bikeModel}>{item.brand} {item.model}</Text>
          <Text style={styles.bikePlate}>{item.licensePlate}</Text>
          <Text style={styles.bikePrice}>{formatCurrency(item.pricePerDay)}/day</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          <View style={[styles.conditionBadge, { backgroundColor: getConditionColor(item.condition) }]}>
            <Text style={styles.conditionText}>{item.condition}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.bikeStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.totalRentals}</Text>
          <Text style={styles.statLabel}>Rentals</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatCurrency(item.totalRevenue)}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.engineCapacity}cc</Text>
          <Text style={styles.statLabel}>Engine</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderStatusFilters = () => {
    console.log('🎛️ Rendering filter buttons, current filter:', statusFilter);
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['', 'available', 'rented', 'maintenance', 'retired'].map(status => {
          const isActive = statusFilter === status;
          console.log('🔘 Button:', status || 'All', 'Active:', isActive);
          return (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                isActive && styles.activeFilterButton
              ]}
              onPress={() => {
                console.log('👆 Button pressed:', status || 'All');
                handleStatusFilter(status);
              }}
            >
              <Text style={[
                styles.filterText,
                isActive && styles.activeFilterText
              ]}>
                {status || 'All'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderBikeModal = () => (
    <Modal
      visible={showBikeModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Bike Details</Text>
          <TouchableOpacity 
            onPress={() => setShowBikeModal(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {selectedBike && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.bikeDetail}>
              <Text style={styles.detailLabel}>Model</Text>
              <Text style={styles.detailValue}>{selectedBike.brand} {selectedBike.model}</Text>
            </View>
            
            <View style={styles.bikeDetail}>
              <Text style={styles.detailLabel}>License Plate</Text>
              <Text style={styles.detailValue}>{selectedBike.licensePlate}</Text>
            </View>
            
            <View style={styles.bikeDetail}>
              <Text style={styles.detailLabel}>Year</Text>
              <Text style={styles.detailValue}>{selectedBike.year}</Text>
            </View>
            
            <View style={styles.bikeDetail}>
              <Text style={styles.detailLabel}>Price per Day</Text>
              <Text style={styles.detailValue}>{formatCurrency(selectedBike.pricePerDay)}</Text>
            </View>
            
            <View style={styles.bikeDetail}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{selectedBike.location}</Text>
            </View>
            
            <View style={styles.bikeDetail}>
              <Text style={styles.detailLabel}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedBike.status) }]}>
                <Text style={styles.statusText}>{selectedBike.status}</Text>
              </View>
            </View>

            <View style={styles.bikeDetail}>
              <Text style={styles.detailLabel}>Condition</Text>
              <View style={[styles.conditionBadge, { backgroundColor: getConditionColor(selectedBike.condition) }]}>
                <Text style={styles.conditionText}>{selectedBike.condition}</Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#4ECDC4' }]}
                onPress={() => handleEditBike(selectedBike)}
              >
                <Ionicons name="pencil" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#E74C3C' }]}
                onPress={() => handleDeleteBike(selectedBike.id)}
              >
                <Ionicons name="trash" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  const renderAddEditModal = () => (
    <Modal
      visible={showAddEditModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{isEditing ? 'Edit Bike' : 'Add New Bike'}</Text>
          <TouchableOpacity 
            onPress={() => setShowAddEditModal(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.inputLabel}>Brand *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.brand}
            onChangeText={(text) => setFormData({...formData, brand: text})}
            placeholder="Enter bike brand"
          />

          <Text style={styles.inputLabel}>Model *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.model}
            onChangeText={(text) => setFormData({...formData, model: text})}
            placeholder="Enter bike model"
          />

          <Text style={styles.inputLabel}>License Plate *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.licensePlate}
            onChangeText={(text) => setFormData({...formData, licensePlate: text})}
            placeholder="Enter license plate"
          />

          <Text style={styles.inputLabel}>Year</Text>
          <TextInput
            style={styles.textInput}
            value={formData.year.toString()}
            onChangeText={(text) => setFormData({...formData, year: parseInt(text) || new Date().getFullYear()})}
            placeholder="Enter year"
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>Price per Day (VND)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.pricePerDay.toString()}
            onChangeText={(text) => setFormData({...formData, pricePerDay: parseInt(text) || 0})}
            placeholder="Enter price per day"
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>Location</Text>
          <TextInput
            style={styles.textInput}
            value={formData.location}
            onChangeText={(text) => setFormData({...formData, location: text})}
            placeholder="Enter location"
          />

          <Text style={styles.inputLabel}>Engine Capacity (cc)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.engineCapacity.toString()}
            onChangeText={(text) => setFormData({...formData, engineCapacity: parseInt(text) || 150})}
            placeholder="Enter engine capacity"
            keyboardType="numeric"
          />

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSaveBike}
          >
            <Text style={styles.saveButtonText}>{isEditing ? 'Update Bike' : 'Add Bike'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bike Management</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddBike}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {renderStatusFilters()}

      <FlatList
        data={bikes}
        renderItem={renderBikeItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
      />

      {renderBikeModal()}
      {renderAddEditModal()}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  addButton: {
    backgroundColor: '#4ECDC4',
    padding: 10,
    borderRadius: 25,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 5,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 80,
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '700',
  },
  bikeCard: {
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
  bikeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  bikeInfo: {
    flex: 1,
  },
  bikeModel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  bikePlate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  bikePrice: {
    fontSize: 16,
    color: '#27AE60',
    fontWeight: '600',
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
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  conditionText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  bikeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
  bikeDetail: {
    marginBottom: 20,
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
    minWidth: 100,
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
  saveButton: {
    backgroundColor: '#4ECDC4',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BikeManagementScreen; 