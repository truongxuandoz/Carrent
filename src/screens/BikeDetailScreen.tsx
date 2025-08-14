import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { bikeService } from '../services/bikeService';
import { getSafeImageSource, handleImageError } from '../utils/placeholderImage';

const { width } = Dimensions.get('window');

interface BikeDetailParams {
  bikeId: string;
}

interface BikeDetail {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  type: string;
  color: string;
  engineCapacity: number;
  fuelType: string;
  transmission: string;
  condition: 'available' | 'rented' | 'maintenance' | 'retired';
  licensePlate: string;
  price_per_hour: number;
  price_per_day: number;
  deposit: number;
  insurance: number;
  address: string;
  description: string;
  images: string[];
  rating: number;
  reviewCount: number;
  is_available: boolean;
  is_approved: boolean;
}

const BikeDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as BikeDetailParams;

  const [bike, setBike] = useState<BikeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    if (params?.bikeId) {
      loadBikeDetail();
    } else {
      Alert.alert('Error', 'Bike ID not provided');
      navigation.goBack();
    }
  }, [params?.bikeId]);

  const loadBikeDetail = async () => {
    try {
      setLoading(true);
      const result = await bikeService.getBikeById(params.bikeId);
      
      if (result.success && result.data) {
        setBike(result.data);
      } else {
        Alert.alert('Error', 'Could not load bike details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading bike detail:', error);
      Alert.alert('Error', 'Failed to load bike details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getConditionColor = (condition: string): string => {
    switch (condition) {
      case 'available': return '#4ECDC4';
      case 'rented': return '#FF6B6B';
      case 'maintenance': return '#FFE66D';
      case 'retired': return '#95A5A6';
      default: return '#BDC3C7';
    }
  };

  const getConditionText = (condition: string): string => {
    switch (condition) {
      case 'available': return 'Có sẵn';
      case 'rented': return 'Đang thuê';
      case 'maintenance': return 'Bảo trì';
      case 'retired': return 'Ngừng hoạt động';
      default: return condition;
    }
  };

  const handleBookNow = () => {
    if (!bike?.is_available || bike?.condition !== 'available') {
      Alert.alert('Không thể đặt', 'Xe này hiện không có sẵn để đặt');
      return;
    }

    setIsBooking(true);
    // Navigate to booking screen
    (navigation.navigate as any)('BookingDetail', { 
      bike: {
        id: bike.id,
        name: bike.name,
        brand: bike.brand,
        pricePerDay: bike.price_per_day,
        pricePerHour: bike.price_per_hour,
        image: bike.images?.[0] || null,
        deposit: bike.deposit,
        insurance: bike.insurance,
      }
    });
    setIsBooking(false);
  };

  const renderImageGallery = () => {
    const images = bike?.images || [];
    const displayImages = images.length > 0 ? images : [null];

    return (
      <View style={styles.imageContainer}>
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(newIndex);
          }}
        >
          {displayImages.map((image, index) => (
            <Image
              key={index}
              source={getSafeImageSource(image, 'bike')}
              style={styles.bikeImage}
              onError={() => handleImageError('bike')}
            />
          ))}
        </ScrollView>
        
        {images.length > 1 && (
          <View style={styles.imageIndicator}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentImageIndex && styles.activeIndicator
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderBikeInfo = () => (
    <View style={styles.infoContainer}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.bikeName}>{bike?.name}</Text>
          <Text style={styles.bikeModel}>{bike?.brand} {bike?.model} ({bike?.year})</Text>
        </View>
        <View style={[styles.conditionBadge, { backgroundColor: getConditionColor(bike?.condition || '') }]}>
          <Text style={styles.conditionText}>{getConditionText(bike?.condition || '')}</Text>
        </View>
      </View>

      <View style={styles.ratingRow}>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>
            {bike?.rating?.toFixed(1) || '0.0'} ({bike?.reviewCount || 0} đánh giá)
          </Text>
        </View>
      </View>

      <View style={styles.priceContainer}>
        <View style={styles.priceHighlight}>
          <Text style={styles.priceMainLabel}>Giá thuê/ngày</Text>
          <Text style={styles.priceMainValue}>{formatCurrency(bike?.price_per_day || 0)}</Text>
        </View>
        
        <View style={styles.priceSecondary}>
          <View style={styles.priceRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.priceLabelSmall}>Theo giờ:</Text>
            <Text style={styles.priceValueSmall}>{formatCurrency(bike?.price_per_hour || 0)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Ionicons name="shield-outline" size={16} color="#666" />
            <Text style={styles.priceLabelSmall}>Tiền cọc:</Text>
            <Text style={styles.priceValueSmall}>{formatCurrency(bike?.deposit || 0)}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSpecifications = () => (
    <View style={styles.specContainer}>
      <Text style={styles.sectionTitle}>Thông số kỹ thuật</Text>
      
      <View style={styles.specList}>
        <View style={styles.specRow}>
          <View style={styles.specIconContainer}>
            <Ionicons name="speedometer-outline" size={24} color="#4ECDC4" />
          </View>
          <View style={styles.specContent}>
            <Text style={styles.specLabel}>Dung tích động cơ</Text>
            <Text style={styles.specValue}>{bike?.engineCapacity}cc</Text>
          </View>
        </View>
        
        <View style={styles.specRow}>
          <View style={styles.specIconContainer}>
            <Ionicons name="car-outline" size={24} color="#4ECDC4" />
          </View>
          <View style={styles.specContent}>
            <Text style={styles.specLabel}>Hộp số</Text>
            <Text style={styles.specValue}>{bike?.transmission === 'automatic' ? 'Tự động' : 'Số sàn'}</Text>
          </View>
        </View>
        
        <View style={styles.specRow}>
          <View style={styles.specIconContainer}>
            <Ionicons name="flash-outline" size={24} color="#4ECDC4" />
          </View>
          <View style={styles.specContent}>
            <Text style={styles.specLabel}>Nhiên liệu</Text>
            <Text style={styles.specValue}>{bike?.fuelType === 'gasoline' ? 'Xăng' : 'Điện'}</Text>
          </View>
        </View>
        
        <View style={styles.specRow}>
          <View style={styles.specIconContainer}>
            <Ionicons name="color-palette-outline" size={24} color="#4ECDC4" />
          </View>
          <View style={styles.specContent}>
            <Text style={styles.specLabel}>Màu sắc</Text>
            <Text style={styles.specValue}>{bike?.color}</Text>
          </View>
        </View>
        
        <View style={styles.specRow}>
          <View style={styles.specIconContainer}>
            <Ionicons name="card-outline" size={24} color="#4ECDC4" />
          </View>
          <View style={styles.specContent}>
            <Text style={styles.specLabel}>Biển số xe</Text>
            <Text style={styles.specValue}>{bike?.licensePlate}</Text>
          </View>
        </View>
        
        {bike?.address && (
          <View style={styles.specRow}>
            <View style={styles.specIconContainer}>
              <Ionicons name="location-outline" size={24} color="#4ECDC4" />
            </View>
            <View style={styles.specContent}>
              <Text style={styles.specLabel}>Địa chỉ</Text>
              <Text style={styles.specValue}>{bike.address}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderDescription = () => (
    <View style={styles.descContainer}>
      <Text style={styles.sectionTitle}>Mô tả</Text>
      <Text style={styles.descText}>
        {bike?.description || 'Không có mô tả cho xe này.'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ECDC4" />
        <Text style={styles.loadingText}>Đang tải thông tin xe...</Text>
      </View>
    );
  }

  if (!bike) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#E74C3C" />
        <Text style={styles.errorText}>Không tìm thấy thông tin xe</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadBikeDetail}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderImageGallery()}
        {renderBikeInfo()}
        {renderSpecifications()}
        {renderDescription()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Fixed bottom booking button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.bookButton,
            (!bike.is_available || bike.condition !== 'available') && styles.bookButtonDisabled
          ]}
          onPress={handleBookNow}
          disabled={isBooking || !bike.is_available || bike.condition !== 'available'}
        >
          {isBooking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="calendar-outline" size={20} color="#fff" />
              <Text style={styles.bookButtonText}>
                {bike.is_available && bike.condition === 'available' ? 'Đặt xe ngay' : 'Không có sẵn'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#E74C3C',
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  bikeImage: {
    width,
    height: 300,
    resizeMode: 'cover',
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#fff',
  },
  infoContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  bikeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  bikeModel: {
    fontSize: 16,
    color: '#666',
  },
  conditionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  conditionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingRow: {
    marginBottom: 15,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  priceContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
  },
  priceHighlight: {
    backgroundColor: '#4ECDC4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  priceMainLabel: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 5,
  },
  priceMainValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  priceSecondary: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  priceLabelSmall: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
    flex: 1,
  },
  priceValueSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  specContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  specList: {
    backgroundColor: '#fff',
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    marginBottom: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
  },
  specIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f8f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  specContent: {
    flex: 1,
  },
  specLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  specValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  descContainer: {
    padding: 20,
  },
  descText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  bottomSpacing: {
    height: 100,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bookButton: {
    backgroundColor: '#4ECDC4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
  },
  bookButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default BikeDetailScreen; 