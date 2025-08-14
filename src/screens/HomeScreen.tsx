import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  RefreshControl,
  Animated,
  Dimensions,
  Modal,
  Alert,
  Easing,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { getSafeImageSource } from '../utils/placeholderImage';
import { RootStackParamList, MainTabParamList } from '../types/navigation';
import { Bike } from '../types';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/SimpleAuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { getOptimizedAvailableBikes, getPopularBikes } from '../services/optimizedBikeService';
import Button from '../components/ui/Button';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import BikeCard from '../components/ui/BikeCard';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Speed Dial constants
const ITEM_GAP = 60; // khoảng cách dọc giữa các nút
const SCALE_FROM = 0.8; // scale ban đầu
const SCALE_TO = 1; // scale cuối

// Interface for database bike data
interface DatabaseBike {
  id: string;
  name: string;
  brand: string;
  model: string;
  price_per_day: number;
  images: string[];
  rating: number;
  review_count: number;
  address: string;
  is_available: boolean;
  license_plate: string;
  type?: string;
}

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, isAuthenticated } = useAuth();
  const { isDark, colors } = useTheme();

  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const fabAnimation = useRef(new Animated.Value(0)).current;
  const speedDialAnimation = useRef(new Animated.Value(0)).current;

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [showSpeedDial, setShowSpeedDial] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [promotionIndex, setPromotionIndex] = useState(0);
  
  // Data state
  const [nearbyBikes, setNearbyBikes] = useState<DatabaseBike[]>([]);
  const [popularBikes, setPopularBikes] = useState<DatabaseBike[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNearby, setLoadingNearby] = useState(true);
  const [loadingPopular, setLoadingPopular] = useState(true);

  // Mock data with promotions
  const promotions = [
    { id: '1', title: 'Giảm 30% xe điện', subtitle: 'Chỉ hôm nay', color: '#FF6B35' },
    { id: '2', title: 'Miễn phí giao xe', subtitle: 'Trong 5km', color: '#4ECDC4' },
    { id: '3', title: 'Ưu đãi sinh viên', subtitle: 'Giảm 20%', color: '#45B7D1' },
  ];

  useEffect(() => {
    // FAB entrance animation
    Animated.spring(fabAnimation, {
      toValue: 1,
      useNativeDriver: true,
      delay: 500,
    }).start();

    // Auto-rotate promotions
    const interval = setInterval(() => {
      setPromotionIndex((prev) => (prev + 1) % promotions.length);
    }, 4000);

    // Load initial data
    loadBikesData();

    return () => clearInterval(interval);
  }, []);

  const loadBikesData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadNearbyBikes(),
        loadPopularBikes()
      ]);
    } catch (error) {
      console.error('❌ Error loading bikes data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyBikes = async () => {
    try {
      setLoadingNearby(true);
      console.log('🔄 Loading nearby bikes...');
      
      const result = await getOptimizedAvailableBikes({ 
        limit: 6,
        page: 1 
      });
      
      if (result.success && result.data) {
        console.log('✅ Nearby bikes loaded:', result.data.length);
        setNearbyBikes(result.data);
      } else {
        console.error('❌ Failed to load nearby bikes:', result.error);
        Alert.alert('Lỗi', 'Không thể tải danh sách xe gần bạn');
      }
    } catch (error) {
      console.error('❌ Error loading nearby bikes:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tải danh sách xe');
    } finally {
      setLoadingNearby(false);
    }
  };

  const loadPopularBikes = async () => {
    try {
      setLoadingPopular(true);
      console.log('🔄 Loading popular bikes...');
      
      const result = await getPopularBikes(6);
      
      if (result.success && result.data) {
        console.log('✅ Popular bikes loaded:', result.data.length);
        setPopularBikes(result.data);
      } else {
        console.error('❌ Failed to load popular bikes:', result.error);
        Alert.alert('Lỗi', 'Không thể tải danh sách xe phổ biến');
      }
    } catch (error) {
      console.error('❌ Error loading popular bikes:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tải danh sách xe phổ biến');
    } finally {
      setLoadingPopular(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBikesData();
    setRefreshing(false);
  };

  // Map database bike to UI bike with enhanced data
  const mapDatabaseBike = (dbBike: DatabaseBike, index: number) => {
    // Get first image or use placeholder
    const bikeImage = dbBike.images && dbBike.images.length > 0 
      ? dbBike.images[0] 
      : getSafeImageSource(null, 'bike').uri;

    // Generate some enhanced data based on index for variety
    const isNew = index === 0 || index === 2; // Mark first and third as new
    const isPopular = dbBike.rating >= 4.5;
    const hasDiscount = index % 3 === 1; // Every third bike has discount
    const discountPercentage = hasDiscount ? Math.floor(Math.random() * 20) + 10 : 0;
    
    return {
      id: dbBike.id,
      name: dbBike.name || `${dbBike.brand} ${dbBike.model}`,
      brand: dbBike.brand,
      model: dbBike.model,
      price: dbBike.price_per_day,
      originalPrice: hasDiscount ? Math.floor(dbBike.price_per_day * 1.2) : undefined,
      image: bikeImage,
      rating: dbBike.rating || 4.0,
      reviews: dbBike.review_count || 0,
      isNew,
      isPopular,
      discount: hasDiscount ? `${discountPercentage}%` : undefined,
      features: generateFeatures(dbBike),
      address: dbBike.address || 'Không rõ địa chỉ',
    };
  };

  // Generate features based on bike data
  const generateFeatures = (bike: DatabaseBike): string[] => {
    const features = [];
    
    if (bike.type === 'electric') {
      features.push('Điện');
    } else {
      features.push('Xăng');
    }
    
    if (bike.type === 'scooter') {
      features.push('Tự động');
    } else if (bike.type === 'manual') {
      features.push('Số sàn');
    } else {
      features.push('Tiện lợi');
    }
    
    if (bike.rating >= 4.5) {
      features.push('Được yêu thích');
    }
    
    return features.slice(0, 2); // Only show 2 features
  };

  const handleBikePress = (bike: any) => {
    navigation.navigate('BookingDetail', { bikeId: bike.id });
  };

  const handleProfilePress = () => {
    if (isAuthenticated) {
      navigation.navigate('Profile');
    } else {
      navigation.navigate('Login');
    }
  };

  const toggleSpeedDial = () => {
    try {
      console.log('🔄 FAB clicked, current showSpeedDial:', showSpeedDial);
      const toValue = showSpeedDial ? 0 : 1;
      setShowSpeedDial(!showSpeedDial);
      
          Animated.spring(speedDialAnimation, {
      toValue,
      useNativeDriver: true,
      tension: 150,
      friction: 10,
      velocity: 1,
    }).start();
      console.log('✅ Speed dial animation started');
    } catch (error) {
      console.error('❌ Error in toggleSpeedDial:', error);
    }
  };

  const handleQuickBooking = () => {
    if (!isAuthenticated) {
      Alert.alert(
        t('auth.loginRequired'),
        t('auth.loginRequiredMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('auth.login'), onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }
    navigation.navigate('History');
  };

  // Header with parallax effect
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [120, 90],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const headerBackgroundOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.98],
    extrapolate: 'clamp',
  });

  // Tạo style cho từng nút con trong speed dial
  const getItemStyle = (index: number) => ({
    ...styles.speedDialOption,
    position: 'absolute' as const,
    bottom: 0, // Đặt cùng gốc với FAB chính
    right: 0,
    transform: [
      {
        translateY: speedDialAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -(index + 1) * ITEM_GAP], // mỗi nút cao hơn 1 bậc
          extrapolate: 'clamp',
        }),
      },
      {
        scale: speedDialAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [SCALE_FROM, SCALE_TO],
          extrapolate: 'clamp',
        }),
      },
    ],
    opacity: speedDialAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
  });

  const renderSkeletonCard = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonText} />
      <View style={[styles.skeletonText, { width: '60%' }]} />
    </View>
  );

  const renderBikeCard = ({ item, index }: { item: any; index: number }) => {
    const animatedScale = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.spring(animatedScale, {
        toValue: 1,
        useNativeDriver: true,
        delay: index * 100,
      }).start();
    }, []);

    return (
      <Animated.View style={{ transform: [{ scale: animatedScale }], marginRight: 15 }}>
        <BikeCard
          id={item.id}
          name={item.name}
          type={`${item.brand} ${item.model}`}
          pricePerHour={Math.round(item.price_per_day / 24)}
          pricePerDay={item.price_per_day}
          imageUrl={item.image}
          status="available"
          rating={item.rating || 4.5}
          discount={item.discount}
          onRent={() => handleBikePress(item)}
          onViewDetails={() => handleBikePress(item)}
        />
      </Animated.View>
    );
  };

  const renderPromotionCarousel = () => (
    <View style={styles.promotionSection}>
      <ScrollView 
        horizontal 
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {promotions.map((promo, index) => (
          <LinearGradient
            key={promo.id}
            colors={[promo.color, `${promo.color}CC`]}
            style={styles.promotionCard}
          >
            <View style={styles.promotionContent}>
              <Text style={styles.promotionTitle}>{promo.title}</Text>
              <Text style={styles.promotionSubtitle}>{promo.subtitle}</Text>
              <TouchableOpacity style={styles.promotionButton}>
                <Text style={styles.promotionButtonText}>Khám phá</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.promotionIcon}>
              <Ionicons name="gift-outline" size={40} color="#fff" />
            </View>
          </LinearGradient>
        ))}
      </ScrollView>
      
      {/* Dots Indicator */}
      <View style={styles.dotsContainer}>
        {promotions.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { opacity: index === promotionIndex ? 1 : 0.3 }
            ]}
          />
        ))}
      </View>
    </View>
  );

  const renderQuickBookingBox = () => (
    <View style={styles.quickBookingContainer}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.quickBookingGradient}
      >
        <View style={styles.quickBookingContent}>
          <View style={styles.quickBookingHeader}>
            <Text style={styles.quickBookingTitle}>Đặt xe nhanh</Text>
            <Text style={styles.quickBookingSubtitle}>Tìm xe phù hợp ngay hôm nay</Text>
          </View>

          {/* Quick Date Selection */}
          <View style={styles.dateQuickSelect}>
            <TouchableOpacity style={styles.dateOption}>
              <Text style={styles.dateOptionText}>Hôm nay</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateOption}>
              <Text style={styles.dateOptionText}>Mai</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dateOption, styles.dateOptionCustom]}>
              <Ionicons name="calendar-outline" size={16} color="#667eea" />
              <Text style={[styles.dateOptionText, { color: '#667eea' }]}>Chọn ngày</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.quickBookButton}
            onPress={handleQuickBooking}
            activeOpacity={0.9}
          >
            <Text style={styles.quickBookButtonText}>Tìm xe ngay</Text>
            <Ionicons name="search" size={18} color="#667eea" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const renderBikeSection = (title: string, bikes: DatabaseBike[], isLoading: boolean) => {
    const mappedBikes = bikes.map(mapDatabaseBike);
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={[styles.viewAllText, { color: isDark ? Colors.primaryDark : Colors.primary }]}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContainer}
        >
          {isLoading ? (
            // Show skeleton cards while loading
            Array.from({ length: 3 }).map((_, index) => (
              <View key={`skeleton-${index}`} style={styles.cardWrapper}>
                {renderSkeletonCard()}
              </View>
            ))
          ) : mappedBikes.length > 0 ? (
            mappedBikes.map((bike, index) => (
              <View key={bike.id} style={styles.cardWrapper}>
                {renderBikeCard({ item: bike, index })}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="bicycle-outline" size={48} color="#95A5A6" />
              <Text style={styles.emptyStateText}>Chưa có xe nào</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

    const renderSpeedDial = () => {
    // Define speed dial items
    const speedDialItems = [
      {
        icon: 'search',
        label: 'Tìm xe',
        onPress: () => {
          console.log('🔍 Search speed dial clicked');
          try {
            navigation.navigate('History');
          } catch (error) {
            console.error('❌ Navigation error:', error);
          }
        }
      },
      {
        icon: 'time',
        label: 'Lịch sử',
        onPress: () => {
          console.log('⏰ History speed dial clicked');
          try {
            navigation.navigate('History');
          } catch (error) {
            console.error('❌ Navigation error:', error);
          }
        }
      },
      // Admin option - conditionally added
      ...(isAuthenticated && user?.role === 'admin' ? [{
        icon: 'settings',
        label: 'Quản trị',
        onPress: () => {
          console.log('⚙️ Admin speed dial clicked');
          try {
            navigation.navigate('Admin');
          } catch (error) {
            console.error('❌ Navigation error:', error);
          }
        }
      }] : [])
    ];

    return (
      <View style={styles.speedDialContainer}>
        {/* Speed Dial Options */}
        {showSpeedDial && speedDialItems.map((item, index) => (
          <Animated.View key={`speed-dial-${index}`} style={getItemStyle(index)}>
            <TouchableOpacity 
              style={styles.speedDialButton} 
              onPress={item.onPress}
              activeOpacity={0.8}
            >
              <Ionicons name={item.icon as any} size={18} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.speedDialLabel}>{item.label}</Text>
          </Animated.View>
        ))}

      {/* Main FAB */}
      <Animated.View
        style={[
          styles.fabContainer,
          {
            transform: [
              { scale: fabAnimation },
              {
                rotate: speedDialAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '45deg'],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity 
          style={styles.fab} 
          onPress={toggleSpeedDial}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <LinearGradient
            colors={['#4ECDC4', '#44A08D']}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* Animated Header */}
      <Animated.View style={[
        styles.header, 
        { 
          backgroundColor: colors.surface,
          height: headerHeight, 
          opacity: headerBackgroundOpacity 
        }
      ]}>
        <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greetingText, { color: colors.text }]}>
              {isAuthenticated ? `Chào ${user?.fullName?.split(' ')[0] || 'Admin'}` : 'Chào bạn'}
            </Text>
            <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>Tìm xe phù hợp hôm nay</Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color={colors.text} />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
              {isAuthenticated ? (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user?.fullName?.charAt(0).toUpperCase() || 'A'}
                  </Text>
                </View>
              ) : (
                <View style={styles.loginPrompt}>
                  <Ionicons name="person-circle-outline" size={32} color="#4ECDC4" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Promotion Carousel */}
        {renderPromotionCarousel()}

        {/* Quick Booking Box */}
        {renderQuickBookingBox()}

        {/* Nearby Bikes Section */}
        {renderBikeSection('Xe gần bạn', nearbyBikes, loadingNearby)}

        {/* Popular Bikes Section */}
        {renderBikeSection('Xe phổ biến', popularBikes, loadingPopular)}

        {/* Bottom Spacing for FAB */}
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>

      {/* Speed Dial FAB */}
      {renderSpeedDial()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    ...Typography.textStyles.h2,
    color: '#2C3E50',
    marginBottom: 2,
  },
  subtitleText: {
    ...Typography.textStyles.caption,
    color: '#7F8C8D',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    ...Typography.textStyles.caption,
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileButton: {
    padding: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Typography.textStyles.body,
    color: '#fff',
    fontWeight: 'bold',
  },
  loginPrompt: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
    paddingTop: 120, // Thêm padding để tránh bị che bởi header
  },
  
  // Promotion Carousel
  promotionSection: {
    marginVertical: 15,
  },
  promotionCard: {
    width: screenWidth - 40,
    height: 120,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promotionContent: {
    flex: 1,
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  promotionSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 12,
  },
  promotionButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  promotionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  promotionIcon: {
    opacity: 0.3,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ECDC4',
  },

  // Quick Booking
  quickBookingContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  quickBookingGradient: {
    padding: 20,
  },
  quickBookingContent: {
    alignItems: 'center',
  },
  quickBookingHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  quickBookingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  quickBookingSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  dateQuickSelect: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  dateOption: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  dateOptionCustom: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    gap: 6,
  },
  dateOptionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickBookButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    minHeight: 50,
  },
  quickBookButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Sections
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  viewAllText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  horizontalScrollContainer: {
    paddingLeft: 20,
    paddingRight: 10,
  },

  // Bike Cards
  cardWrapper: {
    marginRight: 15,
  },
  bikeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  cardImageContainer: {
    position: 'relative',
    height: 160,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 16,
  },
  bikeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 2,
  },
  bikeBrand: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  featuresContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  featureTag: {
    backgroundColor: '#E8F6F3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  featureText: {
    ...Typography.textStyles.caption,
    fontSize: 11,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  ratingText: {
    ...Typography.textStyles.body,
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  reviewsText: {
    ...Typography.textStyles.caption,
    fontSize: 12,
    color: '#7F8C8D',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  originalPrice: {
    ...Typography.textStyles.body,
    fontSize: 14,
    color: '#7F8C8D',
    textDecorationLine: 'line-through',
  },
  price: {
    ...Typography.textStyles.h3,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  priceLabel: {
    ...Typography.textStyles.body,
    fontSize: 14,
    color: '#7F8C8D',
  },
  rentButton: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  rentButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  rentButtonText: {
    ...Typography.textStyles.bodyMedium,
    color: '#fff',
    fontWeight: 'bold',
  },

  // Skeleton Loading
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: 280,
    height: 300,
    padding: 16,
  },
  skeletonImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
  },
  skeletonText: {
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 8,
  },

  // Speed Dial FAB
  speedDialContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  speedDialOption: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedDialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    marginVertical: 2,
  },
  speedDialLabel: {
    fontSize: 11,
    color: '#2C3E50',
    fontWeight: '600',
    marginTop: 3,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    minWidth: 40,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fabContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Spacing
  bottomSpacing: {
    height: 100,
  },
  // New styles for empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    marginTop: 10,
    color: '#95A5A6',
    fontSize: 16,
  },
});

// New Design System Styles
const newStyles = StyleSheet.create({
  bikeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardImageContainer: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 192, // 16:9 aspect ratio for ~340px width
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    resizeMode: 'cover',
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  discountBadge: {
    backgroundColor: '#FF6A00',
  },
  badgeText: {
    ...Typography.textStyles.captionMedium,
    color: '#FFFFFF',
    fontSize: 13,
  },
  cardContent: {
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bikeName: {
    ...Typography.textStyles.h3,
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  engineCapacity: {
    ...Typography.textStyles.caption,
    color: '#64748B',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    ...Typography.textStyles.caption,
    color: '#64748B',
  },
  priceContainer: {
    marginBottom: 16,
  },
  price: {
    ...Typography.textStyles.price,
    color: '#0D6EFD',
  },
  pricePerHour: {
    ...Typography.textStyles.caption,
    color: '#64748B',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  detailButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailButtonText: {
    ...Typography.textStyles.bodyMedium,
    color: '#0D6EFD',
  },
});

export default HomeScreen;
