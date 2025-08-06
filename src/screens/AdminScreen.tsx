import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/SimpleAuthContext';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalUsers: number;
  totalBikes: number;
  activeBookings: number;
  todayRevenue: number;
  monthlyRevenue: number;
  availableBikes: number;
  rentedBikes: number;
  maintenanceBikes: number;
}

const AdminScreen = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBikes: 0,
    activeBookings: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    availableBikes: 0,
    rentedBikes: 0,
    maintenanceBikes: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('🔄 Loading admin dashboard data...');
      const { getDashboardStats } = require('../services/adminService');
      const statsData = await getDashboardStats();
      console.log('✅ Dashboard stats loaded:', statsData);
      setStats(statsData);
    } catch (error) {
      console.error('❌ Error loading admin data:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      
      // Show user there's an error but still display fallback data
      Alert.alert(
        'Data Loading Issue', 
        'Cannot load real data from database. Showing sample data instead. Please check if sample data was created.',
        [{ text: 'OK' }]
      );
      
      // Fallback to mock data if service fails
      setStats({
        totalUsers: 0,
        totalBikes: 0,
        activeBookings: 0,
        todayRevenue: 0,
        monthlyRevenue: 0,
        availableBikes: 0,
        rentedBikes: 0,
        maintenanceBikes: 0,
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <View style={styles.unauthorizedContainer}>
        <Ionicons name="shield-outline" size={80} color="#FF6B6B" />
        <Text style={styles.unauthorizedTitle}>Unauthorized Access</Text>
        <Text style={styles.unauthorizedText}>
          You need admin privileges to access this area.
        </Text>
      </View>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const StatCard = ({ title, value, icon, color, subtitle }: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
    subtitle?: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderDashboardContent = () => (
    <ScrollView
      style={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back, {user?.fullName}</Text>
        <Text style={styles.welcomeSubtext}>Here's what's happening today</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon="people"
          color="#4ECDC4"
        />
        <StatCard
          title="Total Bikes"
          value={stats.totalBikes}
          icon="bicycle"
          color="#45B7D1"
        />
        <StatCard
          title="Active Bookings"
          value={stats.activeBookings}
          icon="calendar"
          color="#F39C12"
        />
        <StatCard
          title="Today Revenue"
          value={formatCurrency(stats.todayRevenue)}
          icon="cash"
          color="#27AE60"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fleet Status</Text>
        <View style={styles.fleetGrid}>
          <StatCard
            title="Available"
            value={stats.availableBikes}
            icon="checkmark-circle"
            color="#27AE60"
            subtitle="Ready to rent"
          />
          <StatCard
            title="Rented"
            value={stats.rentedBikes}
            icon="time"
            color="#F39C12"
            subtitle="Currently in use"
          />
          <StatCard
            title="Maintenance"
            value={stats.maintenanceBikes}
            icon="construct"
            color="#E74C3C"
            subtitle="Under repair"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setActiveTab('bikes')}>
            <Ionicons name="bicycle" size={24} color="#fff" />
            <Text style={styles.actionText}>Manage Bikes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setActiveTab('bookings')}>
            <Ionicons name="calendar" size={24} color="#fff" />
            <Text style={styles.actionText}>View Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setActiveTab('users')}>
            <Ionicons name="people" size={24} color="#fff" />
            <Text style={styles.actionText}>Manage Users</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setActiveTab('reports')}>
            <Ionicons name="analytics" size={24} color="#fff" />
            <Text style={styles.actionText}>View Reports</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderUsersContent = () => {
    const UserManagementScreen = require('./admin/UserManagementScreen').default;
    return <UserManagementScreen />;
  };

  const renderBikesContent = () => {
    const BikeManagementScreen = require('./admin/BikeManagementScreen').default;
    return <BikeManagementScreen />;
  };

  const renderBookingsContent = () => {
    const BookingManagementScreen = require('./admin/BookingManagementScreen').default;
    return <BookingManagementScreen />;
  };

  const renderReportsContent = () => {
    const AnalyticsScreen = require('./admin/AnalyticsScreen').default;
    return <AnalyticsScreen />;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardContent();
      case 'users':
        return renderUsersContent();
      case 'bikes':
        return renderBikesContent();
      case 'bookings':
        return renderBookingsContent();
      case 'reports':
        return renderReportsContent();
      default:
        return renderDashboardContent();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'dashboard', title: 'Dashboard', icon: 'home' },
            { key: 'users', title: 'Users', icon: 'people' },
            { key: 'bikes', title: 'Bikes', icon: 'bicycle' },
            { key: 'bookings', title: 'Bookings', icon: 'calendar' },
            { key: 'reports', title: 'Reports', icon: 'analytics' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.key ? '#4ECDC4' : '#666'}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2C3E50',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  notificationButton: {
    padding: 8,
  },
  tabContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#E8F8F7',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4ECDC4',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeSection: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    width: (width - 50) / 2,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  fleetGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: (width - 50) / 2,
    marginBottom: 15,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    marginTop: 8,
  },
  comingSoon: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2C3E50',
    marginTop: 100,
  },
  comingSoonText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 10,
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  unauthorizedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginTop: 20,
    marginBottom: 10,
  },
  unauthorizedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default AdminScreen; 