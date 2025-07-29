import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, MainTabParamList } from '../types/navigation';
// Debug component removed for production

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;
import QuickBookingBox from '../components/QuickBookingBox';

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const mockBikes = [
    {
      id: '1',
      name: 'Honda Vision',
      brand: 'Honda',
      price: 150000,
      image: 'https://via.placeholder.com/150',
      rating: 4.5,
    },
    {
      id: '2',
      name: 'Yamaha Grande',
      brand: 'Yamaha',
      price: 180000,
      image: 'https://via.placeholder.com/150',
      rating: 4.3,
    },
    {
      id: '3',
      name: 'SYM Attila',
      brand: 'SYM',
      price: 200000,
      image: 'https://via.placeholder.com/150',
      rating: 4.7,
    },
  ];

  const handleBikePress = (bike: any) => {
    navigation.navigate('BookingDetail', { 
      bikeId: bike.id
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>{t('home.welcome')}</Text>
        <Text style={styles.subtitleText}>{t('home.findYourBike')}</Text>
      </View>

              {/* Debug component removed for clean UI */}

      {/* Quick Booking Box */}
      <QuickBookingBox />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.nearbyBikes')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.viewAllText}>{t('home.viewAll')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {mockBikes.map((bike) => (
            <TouchableOpacity
              key={bike.id}
              style={styles.bikeCard}
              onPress={() => handleBikePress(bike)}
            >
              <Image source={{ uri: bike.image }} style={styles.bikeImage} />
              <View style={styles.bikeInfo}>
                <Text style={styles.bikeName}>{bike.name}</Text>
                <Text style={styles.bikeBrand}>{bike.brand}</Text>
                <Text style={styles.bikePrice}>{bike.price.toLocaleString()} VND/ngày</Text>
                <View style={styles.ratingContainer}>
                  <Text style={styles.rating}> {bike.rating}</Text>
                  <TouchableOpacity style={styles.rentButton} onPress={() => handleBikePress(bike)}>
                    <Text style={styles.rentButtonText}>{t('bike.rentNow')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.popularBikes')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.viewAllText}>{t('home.viewAll')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {mockBikes.map((bike) => (
            <TouchableOpacity
              key={`popular-${bike.id}`}
              style={styles.bikeCard}
              onPress={() => handleBikePress(bike)}
            >
              <Image source={{ uri: bike.image }} style={styles.bikeImage} />
              <View style={styles.bikeInfo}>
                <Text style={styles.bikeName}>{bike.name}</Text>
                <Text style={styles.bikeBrand}>{bike.brand}</Text>
                <Text style={styles.bikePrice}>{bike.price.toLocaleString()} VND/ngày</Text>
                <View style={styles.ratingContainer}>
                  <Text style={styles.rating}> {bike.rating}</Text>
                  <TouchableOpacity style={styles.rentButton} onPress={() => handleBikePress(bike)}>
                    <Text style={styles.rentButtonText}>{t('bike.rentNow')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Featured Section */}
      <View style={styles.featuredSection}>
        <Text style={styles.featuredTitle}> {t('home.featured')}</Text>
        <View style={styles.featuredContent}>
          <Text style={styles.featuredText}>{t('home.featuredDesc')}</Text>
          <TouchableOpacity style={styles.featuredButton} onPress={() => navigation.navigate('History')}>
            <Text style={styles.featuredButtonText}>{t('home.exploreNow')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
  },
  bikeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    width: 200,
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
    height: 120,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
  },
  bikeInfo: {
    flex: 1,
  },
  bikeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  bikeBrand: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  bikePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: '#666',
  },
  rentButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rentButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  featuredSection: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 40,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  featuredContent: {
    alignItems: 'center',
  },
  featuredText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  featuredButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  featuredButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
