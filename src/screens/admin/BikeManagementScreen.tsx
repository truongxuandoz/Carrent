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
  Dimensions,
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
import AddBikeModal from '../../components/AddBikeModal';
import ImagePickerComponent from '../../components/ImagePickerComponent';
import Button from '../../components/ui/Button';
import { bikeService } from '../../services/bikeService';
import { imageUploadService } from '../../services/imageUploadService';
import { getSafeImageSource } from '../../utils/placeholderImage';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import BikeCard from '../../components/ui/BikeCard';

const BikeManagementScreen = () => {
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  const [bikes, setBikes] = useState<BikeManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedBike, setSelectedBike] = useState<BikeManagement | null>(null);
  const [showBikeModal, setShowBikeModal] = useState(false);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showAddBikeModal, setShowAddBikeModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Form states for add/edit (simplified to match AddBikeModal)
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'scooter',
    engineCapacity: 110,
    fuelType: 'gasoline',
    transmission: 'automatic',
    condition: 'available' as 'available' | 'rented' | 'maintenance' | 'retired',
    color: '',
    licensePlate: '',
    pricePerDay: 0,
    images: [] as string[],
  });
  const [imageDataList, setImageDataList] = useState<Array<{uri: string; base64?: string}>>([]);

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
    console.log('🔄 Resetting form data and image data');
    setFormData({
      name: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      type: 'scooter',
      engineCapacity: 110,
      fuelType: 'gasoline',
      transmission: 'automatic',
      condition: 'available',
      color: '',
      licensePlate: '',
      pricePerDay: 0,
      images: [],
    });
    setImageDataList([]);
    setSelectedBike(null);
    setIsEditing(false);
  };

  const handleAddBike = () => {
    console.log('🚀 Opening Add Bike Modal');
    setShowAddBikeModal(true);
  };

  const handleSubmitNewBike = async (bikeData: any) => {
    try {
      console.log('🔄 Submitting new bike:', bikeData);

      // Use admin service to create bike with auto-approval
      const result = await bikeService.createBikeForAdmin(bikeData);

      if (result.success) {
        console.log('✅ Bike created successfully');
        Alert.alert('Thành công', 'Xe đã được thêm thành công!');
        
        // Refresh the bike list
        await loadBikes();
        
        setShowAddBikeModal(false);
      } else {
        throw new Error(result.error || 'Failed to create bike');
      }
    } catch (error) {
      console.error('❌ Error creating bike:', error);
      Alert.alert(
        'Lỗi', 
        error instanceof Error ? error.message : 'Không thể tạo xe. Vui lòng thử lại.'
      );
    }
  };

  const handleEditBike = (bike: BikeManagement) => {
    const bikeAny = bike as any; // Temporary cast for new fields
    
    console.log('🔧 Setting up edit mode for bike:', bike.id);
    console.log('📸 Existing bike images:', bike.images);
    
    setFormData({
      name: bikeAny.name || `${bike.brand} ${bike.model}`,
      brand: bike.brand,
      model: bike.model,
      year: bike.year,
      type: bikeAny.type || 'scooter',
      engineCapacity: bike.engineCapacity,
      fuelType: bike.fuelType,
      transmission: bike.transmission,
      condition: bike.condition,
      color: bikeAny.color || '',
      licensePlate: bike.licensePlate,
      pricePerDay: bike.pricePerDay,
      images: bike.images || [], // Ensure it's always an array
    });
    
    // Set image data list for editing - important for ImagePickerComponent
    const imageData = (bike.images || []).map(uri => ({ 
      uri,
      // Don't include base64 for existing images as they're already uploaded
    }));
    setImageDataList(imageData);
    
    console.log('✅ Edit mode setup complete. Images:', bike.images?.length || 0);
    
    setSelectedBike(bike);
    setIsEditing(true);
    setShowBikeModal(false);
    setShowAddEditModal(true);
  };

  const handleSaveBike = async () => {
    // Validate required fields
    if (!formData.name.trim() || !formData.brand.trim() || !formData.model.trim() || !formData.licensePlate.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc (Tên xe, Hãng, Model, Biển số)');
      return;
    }

    try {
      let uploadedImageUrls: string[] = [];

      // Generate temporary bike ID for image upload
      const tempBikeId = isEditing && selectedBike ? `edit_${selectedBike.id}` : `temp_${Date.now()}`;
      
      console.log('🔄 Processing images for bike save...');
      console.log('📸 Current formData.images:', formData.images.length);
      console.log('📸 Current imageDataList:', imageDataList.length);

      // Handle image uploads using the same logic as AddBikeModal
      if (formData.images.length > 0) {
        console.log('🚀 Uploading images with OPTIMAL binary method...');
        
        // PRIORITY 1: Pure binary upload (most efficient)
        const uploadPromises = formData.images.map((uri, index) => {
          if (uri && !uri.startsWith('http')) {
            // This is a new local image, upload it
            console.log(`📤 Uploading new image ${index}: ${uri.substring(0, 50)}...`);
            return imageUploadService.uploadImageBinaryOnly(uri, `${tempBikeId}_${index}`);
          } else {
            // This is already an uploaded image URL, keep it
            console.log(`✅ Keeping existing image ${index}: ${uri.substring(0, 50)}...`);
            return Promise.resolve({ success: true, url: uri });
          }
        });
        
        const results = await Promise.all(uploadPromises);
        uploadedImageUrls = results
          .filter(result => result.success)
          .map(result => result.url!)
          .filter(Boolean);
        
        console.log('🎯 Binary upload results:', uploadedImageUrls.length, 'successful');
        
        // FALLBACK: If binary fails for new images, try with base64 data
        if (uploadedImageUrls.length < formData.images.length && imageDataList.length > 0) {
          console.log('⚠️ Some binary uploads failed, trying base64 fallback...');
          
          // Only upload the failed ones with base64
          const failedIndices = results
            .map((result, index) => result.success ? -1 : index)
            .filter(index => index !== -1);
          
          if (failedIndices.length > 0) {
            const failedImageData = failedIndices
              .map(index => imageDataList[index])
              .filter(Boolean);
            
            if (failedImageData.length > 0) {
              const fallbackUrls = await imageUploadService.uploadMultipleImagesWithBase64(
                failedImageData,
                tempBikeId
              );
              
              // Merge successful uploads with fallback uploads
              uploadedImageUrls = [...uploadedImageUrls, ...fallbackUrls];
            }
          }
        }
      }

      console.log('✅ OPTIMAL upload results:', uploadedImageUrls.length, 'successful uploads');
      console.log('🔗 Final uploaded URLs:', uploadedImageUrls);

      if (uploadedImageUrls.length === 0 && formData.images.length > 0) {
        throw new Error('Không thể upload ảnh. Vui lòng thử lại.');
      }

      // Prepare bike data with uploaded image URLs (expanded for admin service)
      const bikeDataToSave = {
        ...formData,
        images: uploadedImageUrls,
        // Add default values for missing fields
        pricePerHour: Math.round(formData.pricePerDay / 10) || 0,
        location: 'Admin Location',
        address: 'Admin Address',
        description: `${formData.brand} ${formData.model} - ${formData.year}`,
        deposit: formData.pricePerDay * 2,
        insurance: formData.pricePerDay * 0.1,
        features: [],
        lastMaintenance: '',
        nextMaintenance: '',
      };

      if (isEditing && selectedBike) {
        // Update existing bike
        await updateBike(selectedBike.id, bikeDataToSave);
        setBikes(prev => prev.map(bike => 
          bike.id === selectedBike.id 
            ? { ...bike, ...bikeDataToSave }
            : bike
        ));
        Alert.alert('Thành công', 'Đã cập nhật xe thành công!');
      } else {
        // Create new bike using bike service
        const result = await bikeService.createBikeForAdmin({
          ...formData,
          type: formData.type as 'scooter' | 'manual' | 'sport' | 'electric',
          fuelType: formData.fuelType as 'gasoline' | 'electric',
          transmission: formData.transmission as 'automatic' | 'manual',
          images: uploadedImageUrls,
          // Transform to CreateBikeData format
          location: { lat: 10.7769, lng: 106.7009 }, // Default location
        });
        
        if (result.success) {
          // Refresh the bike list
          await loadBikes();
          Alert.alert('Thành công', 'Đã thêm xe mới thành công!');
        } else {
          throw new Error(result.error);
        }
      }
      
      setShowAddEditModal(false);
      resetForm();
    } catch (error) {
      console.error('❌ Error saving bike:', error);
      Alert.alert('Lỗi', 'Không thể lưu thông tin xe. Vui lòng thử lại.');
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

  // Helper function to render transmission type safely
  const renderTransmission = (transmission: string | undefined): string => {
    switch (transmission) {
      case 'automatic': return 'Tự động';
      case 'manual': return 'Số sàn';
      default: return 'Không rõ';
    }
  };

  // Helper function to render fuel type safely  
  const renderFuelType = (fuelType: string | undefined): string => {
    switch (fuelType) {
      case 'gasoline': return 'Xăng';
      case 'electric': return 'Điện';
      default: return 'Không rõ';
    }
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



  const renderBikeItemOld = ({ item }: { item: BikeManagement }) => {
    // Get the first image or use placeholder
    const bikeImage = item.images && item.images.length > 0 ? item.images[0] : null;
    
    const getConditionBadge = () => {
      switch (item.condition) {
        case 'available':
          return { text: 'Còn xe', color: '#16A34A' }; // Success
        case 'rented':
          return { text: 'Đã thuê', color: '#F59E0B' }; // Warning
        case 'maintenance':
          return { text: 'Bảo trì', color: '#EF4444' }; // Error
        case 'retired':
          return { text: 'Ngừng hoạt động', color: '#64748B' }; // Neutral
        default:
          return { text: 'Không xác định', color: '#64748B' };
      }
    };

    const badge = getConditionBadge();
    
    return (
      <TouchableOpacity 
        style={adminStyles.bikeCard}
        onPress={() => {
          setSelectedBike(item);
          setShowBikeModal(true);
        }}
        activeOpacity={0.9}
      >
        {/* Bike Image */}
        <View style={adminStyles.bikeImageContainer}>
          {bikeImage ? (
            <Image 
              source={{ uri: bikeImage }} 
              style={adminStyles.bikeImage}
              resizeMode="cover"
            />
          ) : (
            <View style={adminStyles.placeholderImage}>
              <Ionicons name="bicycle-outline" size={40} color="#94A3B8" />
              <Text style={adminStyles.noImageText}>Chưa có ảnh</Text>
            </View>
          )}
          
          {/* Status badge overlay */}
          <View style={adminStyles.badgeContainer}>
            <View style={[adminStyles.statusBadge, { backgroundColor: badge.color }]}>
              <Text style={adminStyles.statusText}>{badge.text}</Text>
            </View>
          </View>
        </View>

        {/* Card Content */}
        <View style={adminStyles.cardContent}>
          {/* Header */}
          <View style={adminStyles.cardHeader}>
            <View style={adminStyles.titleContainer}>
              <Text style={adminStyles.bikeName} numberOfLines={1}>
                {item.brand} {item.model}
              </Text>
              <Text style={adminStyles.licensePlate}>{item.licensePlate}</Text>
            </View>
            <Text style={adminStyles.engineCapacity}>{item.engineCapacity}cc</Text>
          </View>

          {/* Price */}
          <View style={adminStyles.priceContainer}>
            <Text style={adminStyles.price}>
              {formatCurrency(item.pricePerDay)}/ngày
            </Text>
            {item.pricePerHour && (
              <Text style={adminStyles.pricePerHour}>
                {formatCurrency(item.pricePerHour)}/giờ
              </Text>
            )}
          </View>
          
          {/* Stats */}
          <View style={adminStyles.statsContainer}>
            <View style={adminStyles.statItem}>
              <Text style={adminStyles.statValue}>{item.totalRentals}</Text>
              <Text style={adminStyles.statLabel}>Lượt thuê</Text>
            </View>
            <View style={adminStyles.statItem}>
              <Text style={adminStyles.statValue}>{formatCurrency(item.totalRevenue)}</Text>
              <Text style={adminStyles.statLabel}>Doanh thu</Text>
            </View>
            <View style={adminStyles.statItem}>
              <Text style={adminStyles.statValue}>
                {item.year || 'N/A'}
              </Text>
              <Text style={adminStyles.statLabel}>Năm SX</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStatusFilters = () => {
    const filterLabels = {
      '': 'Tất cả',
      'available': 'Có sẵn',
      'rented': 'Đã thuê',
      'maintenance': 'Bảo trì',
      'retired': 'Ngừng hoạt động'
    };

    return (
      <View style={[
        styles.filterContainer, 
        { 
          backgroundColor: colors.surface, 
          borderBottomColor: colors.border 
        }
      ]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {['', 'available', 'rented', 'maintenance', 'retired'].map(status => {
            const isActive = statusFilter === status;
            return (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive 
                      ? (isDark ? Colors.primaryDark : Colors.primary)
                      : (isDark ? Colors.neutral[800] : Colors.neutral[100]),
                    borderColor: isActive 
                      ? (isDark ? Colors.primaryDark : Colors.primary)
                      : colors.border,
                  }
                ]}
                onPress={() => handleStatusFilter(status)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[
                  styles.filterChipText,
                  {
                    color: isActive 
                      ? '#FFFFFF'
                      : colors.text
                  }
                ]}>
                  {filterLabels[status as keyof typeof filterLabels]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };



  const renderNewBikeItem = ({ item }: { item: BikeManagement }) => {
    const imageUrl = item.images && item.images.length > 0 
      ? getSafeImageSource(item.images[0]).uri 
      : 'https://via.placeholder.com/300x200?text=No+Image';

    // Calculate rating based on total rentals (mock calculation)
    const rating = item.totalRentals > 0 
      ? Math.min(4.5 + (item.totalRentals / 100), 5.0) 
      : 4.5;

    return (
      <BikeCard
        id={item.id}
        name={item.name}
        type={`${item.brand} ${item.model} (${item.year}) - ${item.engineCapacity}cc`}
        pricePerHour={item.pricePerHour}
        pricePerDay={item.pricePerDay}
        imageUrl={imageUrl}
        status={item.condition as 'available' | 'rented' | 'maintenance'}
        rating={rating}
        onRent={() => {
          if (item.condition === 'available') {
            Alert.alert(
              'Thuê xe', 
              `Bạn có muốn thuê ${item.name} (${item.licensePlate})?`,
              [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Thuê ngay', onPress: () => {
                  // Navigate to booking flow
                  Alert.alert('Thông báo', 'Chức năng thuê xe sẽ được triển khai');
                }}
              ]
            );
          } else {
            Alert.alert('Thông báo', 'Xe này hiện không khả dụng');
          }
        }}
        onViewDetails={() => {
          setSelectedBike(item);
          setShowBikeModal(true);
        }}
        onEdit={() => {
          setSelectedBike(item);
          setFormData({
            name: item.name,
            brand: item.brand,
            model: item.model,
            year: item.year,
            type: item.type,
            engineCapacity: item.engineCapacity,
            fuelType: item.fuelType,
            transmission: item.transmission,
            condition: item.condition,
            color: item.color,
            licensePlate: item.licensePlate,
            pricePerDay: item.pricePerDay,
            images: item.images || [],
          });
          setImageDataList(
            (item.images || []).map(uri => ({ uri }))
          );
          setIsEditing(true);
          setShowAddEditModal(true);
        }}
        isAdmin={true}
      />
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
          <Text style={styles.modalTitle}>Chi tiết xe</Text>
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
              <Text style={styles.detailLabel}>Tên xe</Text>
              <Text style={styles.detailValue}>
                {selectedBike.name || `${selectedBike.brand || ''} ${selectedBike.model || ''}`.trim() || 'Chưa có tên'}
              </Text>
            </View>
            
            <View style={styles.bikeDetail}>
              <Text style={styles.detailLabel}>Hãng xe</Text>
              <Text style={styles.detailValue}>{selectedBike.brand || 'Chưa có'}</Text>
            </View>
            
            <View style={styles.bikeDetail}>
              <Text style={styles.detailLabel}>Model</Text>
              <Text style={styles.detailValue}>{selectedBike.model || 'Chưa có'}</Text>
            </View>
            
            <View style={styles.bikeDetail}>
              <Text style={styles.detailLabel}>Biển số</Text>
              <Text style={styles.detailValue}>{selectedBike.licensePlate || 'Chưa có'}</Text>
            </View>
            
            <View style={styles.bikeDetail}>
              <Text style={styles.detailLabel}>Năm sản xuất</Text>
              <Text style={styles.detailValue}>{selectedBike.year ? String(selectedBike.year) : 'Chưa rõ'}</Text>
            </View>
            
            <View style={styles.bikeDetail}>
              <Text style={styles.detailLabel}>Dung tích động cơ</Text>
              <Text style={styles.detailValue}>{selectedBike.engineCapacity ? `${selectedBike.engineCapacity}cc` : 'Chưa có'}</Text>
            </View>
            
            <View style={styles.bikeDetail}>
              <Text style={styles.detailLabel}>Hộp số</Text>
              <Text style={styles.detailValue}>{renderTransmission(selectedBike.transmission)}</Text>
            </View>
            
            <View style={styles.bikeDetail}>
              <Text style={styles.detailLabel}>Nhiên liệu</Text>
              <Text style={styles.detailValue}>{renderFuelType(selectedBike.fuelType)}</Text>
            </View>
            
            <View style={styles.bikeDetail}>
              <Text style={styles.detailLabel}>Giá thuê/ngày</Text>
              <Text style={styles.detailValue}>{formatCurrency(selectedBike.pricePerDay || 0)}</Text>
            </View>
            
            <View style={styles.bikeDetail}>
              <Text style={styles.detailLabel}>Tình trạng</Text>
              <Text style={styles.detailValue}>{selectedBike.condition || 'Không rõ'}</Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#4ECDC4' }]}
                onPress={() => handleEditBike(selectedBike)}
              >
                <Ionicons name="pencil" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Chỉnh sửa</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#E74C3C' }]}
                onPress={() => handleDeleteBike(selectedBike.id)}
              >
                <Ionicons name="trash" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Xóa</Text>
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
            onPress={() => {
              setShowAddEditModal(false);
              resetForm();
            }}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Images */}
          <Text style={styles.inputLabel}>Hình ảnh xe</Text>
          <ImagePickerComponent
            images={formData.images}
            onImagesChange={(images) => {
              console.log('📸 Images changed in edit modal:', images.length);
              setFormData({...formData, images});
            }}
            onImageDataChange={(imageData) => {
              console.log('📸 Image data changed in edit modal:', imageData.length);
              setImageDataList(imageData);
            }}
            maxImages={5}
            disabled={false}
          />

          {/* Basic Info */}
          <Text style={styles.inputLabel}>Tên xe *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.name}
            onChangeText={(text) => setFormData({...formData, name: text})}
            placeholder="VD: Honda Vision 2023"
          />

          <Text style={styles.inputLabel}>Hãng xe *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.brand}
            onChangeText={(text) => setFormData({...formData, brand: text})}
            placeholder="VD: Honda"
          />

          <Text style={styles.inputLabel}>Model *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.model}
            onChangeText={(text) => setFormData({...formData, model: text})}
            placeholder="VD: Vision"
          />

          <Text style={styles.inputLabel}>Biển số xe *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.licensePlate}
            onChangeText={(text) => setFormData({...formData, licensePlate: text})}
            placeholder="VD: 29A1-12345"
          />

          <Text style={styles.inputLabel}>Năm sản xuất</Text>
          <TextInput
            style={styles.textInput}
            value={formData.year.toString()}
            onChangeText={(text) => setFormData({...formData, year: parseInt(text) || new Date().getFullYear()})}
            placeholder="VD: 2023"
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>Màu sắc</Text>
          <TextInput
            style={styles.textInput}
            value={formData.color}
            onChangeText={(text) => setFormData({...formData, color: text})}
            placeholder="VD: Đỏ"
          />

          <Text style={styles.inputLabel}>Dung tích máy (cc)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.engineCapacity.toString()}
            onChangeText={(text) => setFormData({...formData, engineCapacity: parseInt(text) || 110})}
            placeholder="VD: 125"
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>Giá thuê/ngày (VNĐ) *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.pricePerDay.toString()}
            onChangeText={(text) => setFormData({...formData, pricePerDay: parseInt(text) || 0})}
            placeholder="VD: 150000"
            keyboardType="numeric"
          />

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSaveBike}
          >
            <Text style={styles.saveButtonText}>{isEditing ? 'Cập nhật xe' : 'Thêm xe'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Quản lý xe</Text>
        <Button
          title="Thêm xe"
          onPress={handleAddBike}
          variant="primary"
          size="medium"
          icon={<Ionicons name="add" size={20} color="#fff" />}
          testID="add-button"
        />
      </View>

      {renderStatusFilters()}

      <FlatList
        data={bikes}
        renderItem={renderNewBikeItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      {renderBikeModal()}
      {renderAddEditModal()}
      
      <AddBikeModal
        visible={showAddBikeModal}
        onClose={() => setShowAddBikeModal(false)}
        onSubmit={handleSubmitNewBike}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    ...Typography.textStyles.h2,
  },
  listContainer: {
    padding: Spacing.lg,
  },
  addButton: {
    backgroundColor: '#4ECDC4',
    padding: 10,
    borderRadius: 25,
  },
  filterContainer: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.chip,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  filterChipText: {
    ...Typography.textStyles.captionMedium,
  },
  bikeCard: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 12,
    padding: 0, // Changed to 0 so image can fill the top
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden', // Ensure image respects border radius
  },
  bikeImageContainer: {
    height: 150,
    width: '100%',
    position: 'relative',
    backgroundColor: '#f5f5f5',
  },
  bikeImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  noImageText: {
    fontSize: 12,
    color: '#95A5A6',
    marginTop: 5,
  },
  imageStatusOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  bikeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingTop: 15,
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
    paddingHorizontal: 15,
    paddingBottom: 15,
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
  modalImageContainer: {
    height: 200,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageScrollView: {
    height: 200,
  },
  modalBikeImage: {
    width: 300,
    height: 200,
    marginRight: 10,
    borderRadius: 8,
  },
  modalPlaceholderImage: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 20,
  },
  modalNoImageText: {
    fontSize: 16,
    color: '#95A5A6',
    marginTop: 10,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
  
  // Enhanced Bike Details Modal Styles
  enhancedModalHeader: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f8f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  enhancedModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  enhancedCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedModalContent: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  heroSection: {
    position: 'relative',
    marginBottom: 20,
  },
  heroImageContainer: {
    height: 250,
    backgroundColor: '#fff',
    position: 'relative',
  },
  heroImage: {
    width: Dimensions.get('window').width,
    height: 250,
    resizeMode: 'cover',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  heroPlaceholder: {
    height: 250,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPlaceholderText: {
    color: '#95A5A6',
    fontSize: 14,
    marginTop: 8,
  },
  heroStatusBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  bikeTitleSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 15,
  },
  bikeMainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  bikeSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  pricingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  enhancedActionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 15,
  },
  primaryActionButton: {
    backgroundColor: '#4ECDC4',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dangerActionButton: {
    backgroundColor: '#E74C3C',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dangerActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 30,
  },
});

// New Admin Design System Styles
const adminStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0F172A',
  },
  listContainer: {
    padding: 16,
  },
  separator: {
    height: 16,
  },
  bikeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  bikeImageContainer: {
    position: 'relative',
    height: 160,
  },
  bikeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 8,
    fontWeight: '400',
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  bikeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  licensePlate: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  engineCapacity: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '400',
  },
  priceContainer: {
    marginBottom: 16,
  },
  price: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0D6EFD',
    fontFamily: 'monospace',
  },
  pricePerHour: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '400',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '400',
  },
});

export default BikeManagementScreen; 