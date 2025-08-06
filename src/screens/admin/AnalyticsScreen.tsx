import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { 
  getDashboardStats, 
  getRevenueData, 
  getPopularBikes, 
  AdminDashboardStats,
  RevenueData,
  PopularBike 
} from '../../services/adminService';

const { width } = Dimensions.get('window');

const AnalyticsScreen = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [popularBikes, setPopularBikes] = useState<PopularBike[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(30); // days

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      console.log('🔄 Loading analytics data...');
      setLoading(true);
      
      const [statsData, revenueResponse, popularBikesData] = await Promise.all([
        getDashboardStats(),
        getRevenueData(selectedPeriod),
        getPopularBikes(10)
      ]);
      
      console.log('✅ Analytics data loaded:', {
        stats: statsData,
        revenue: revenueResponse.length + ' records',
        popularBikes: popularBikesData.length + ' bikes'
      });
      
      setStats(statsData);
      setRevenueData(revenueResponse);
      setPopularBikes(popularBikesData);
    } catch (error) {
      console.error('❌ Error loading analytics data:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      
      // Set empty states for failed data
      setStats(null);
      setRevenueData([]);
      setPopularBikes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalyticsData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M VND`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K VND`;
    }
    return formatCurrency(amount);
  };

  const getGrowthPercentage = () => {
    if (revenueData.length < 7) return 0;
    
    const lastWeek = revenueData.slice(-7).reduce((sum, day) => sum + day.revenue, 0);
    const previousWeek = revenueData.slice(-14, -7).reduce((sum, day) => sum + day.revenue, 0);
    
    if (previousWeek === 0) return 100;
    return ((lastWeek - previousWeek) / previousWeek) * 100;
  };

  const getMaxRevenue = () => {
    return Math.max(...revenueData.map(day => day.revenue));
  };

  const StatCard = ({ title, value, icon, color, subtitle, growth }: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
    subtitle?: string;
    growth?: number;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      {growth !== undefined && (
        <View style={styles.growthContainer}>
          <Ionicons 
            name={growth >= 0 ? "trending-up" : "trending-down"} 
            size={16} 
            color={growth >= 0 ? "#27AE60" : "#E74C3C"} 
          />
          <Text style={[
            styles.growthText,
            { color: growth >= 0 ? "#27AE60" : "#E74C3C" }
          ]}>
            {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
          </Text>
        </View>
      )}
    </View>
  );

  const SimpleChart = ({ data }: { data: RevenueData[] }) => {
    const maxRevenue = getMaxRevenue();
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Revenue Trend ({selectedPeriod} days)</Text>
        <View style={styles.chart}>
          {data.map((day, index) => {
            const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 120 : 0;
            return (
              <View key={index} style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: Math.max(height, 2),
                      backgroundColor: day.revenue > 0 ? '#4ECDC4' : '#E0E0E0'
                    }
                  ]} 
                />
                {index % 5 === 0 && (
                  <Text style={styles.barLabel}>
                    {new Date(day.date).getDate()}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
        <View style={styles.chartLegend}>
          <Text style={styles.legendText}>
            Total: {formatCompactCurrency(data.reduce((sum, day) => sum + day.revenue, 0))}
          </Text>
          <Text style={styles.legendText}>
            Avg: {formatCompactCurrency(data.reduce((sum, day) => sum + day.revenue, 0) / data.length)}
          </Text>
        </View>
      </View>
    );
  };

  const PopularBikesSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Top Performing Bikes</Text>
      {popularBikes.map((bike, index) => (
        <View key={bike.id} style={styles.popularBikeItem}>
          <View style={styles.rankContainer}>
            <Text style={styles.rankText}>#{index + 1}</Text>
          </View>
          <View style={styles.bikeInfo}>
            <Text style={styles.bikeModel}>{bike.model}</Text>
            <Text style={styles.bikeStats}>
              {bike.rentals} rentals • {formatCompactCurrency(bike.revenue)}
            </Text>
          </View>
          <View style={styles.performanceBar}>
            <View 
              style={[
                styles.performanceBarFill,
                { 
                  width: `${(bike.rentals / (popularBikes[0]?.rentals || 1)) * 100}%`,
                  backgroundColor: index < 3 ? '#4ECDC4' : '#95A5A6'
                }
              ]} 
            />
          </View>
        </View>
      ))}
    </View>
  );

  const PeriodSelector = () => (
    <View style={styles.periodSelector}>
      {[7, 30, 90].map(period => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.activePeriodButton
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodText,
            selectedPeriod === period && styles.activePeriodText
          ]}>
            {period}d
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Analytics & Reports</Text>
        <PeriodSelector />
      </View>

      {stats && (
        <>
          {/* Key Metrics */}
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Revenue"
              value={formatCompactCurrency(stats.monthlyRevenue)}
              icon="cash"
              color="#27AE60"
              subtitle="This month"
              growth={getGrowthPercentage()}
            />
            <StatCard
              title="Active Bookings"
              value={stats.activeBookings}
              icon="calendar"
              color="#F39C12"
              subtitle="Currently active"
            />
            <StatCard
              title="Fleet Utilization"
              value={`${Math.round((stats.rentedBikes / (stats.totalBikes || 1)) * 100)}%`}
              icon="bicycle"
              color="#3498DB"
              subtitle={`${stats.rentedBikes}/${stats.totalBikes} bikes`}
            />
            <StatCard
              title="Customer Growth"
              value={stats.totalUsers}
              icon="people"
              color="#9B59B6"
              subtitle="Total customers"
            />
          </View>

          {/* Revenue Chart */}
          {revenueData.length > 0 && (
            <SimpleChart data={revenueData} />
          )}

          {/* Booking Status Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Booking Status Overview</Text>
            <View style={styles.bookingStatusGrid}>
              <View style={styles.statusItem}>
                <Text style={styles.statusValue}>{stats.pendingBookings}</Text>
                <Text style={styles.statusLabel}>Pending</Text>
                <View style={[styles.statusBar, { backgroundColor: '#F39C12' }]} />
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusValue}>{stats.activeBookings}</Text>
                <Text style={styles.statusLabel}>Active</Text>
                <View style={[styles.statusBar, { backgroundColor: '#27AE60' }]} />
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusValue}>{stats.completedBookings}</Text>
                <Text style={styles.statusLabel}>Completed</Text>
                <View style={[styles.statusBar, { backgroundColor: '#2ECC71' }]} />
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusValue}>{stats.cancelledBookings}</Text>
                <Text style={styles.statusLabel}>Cancelled</Text>
                <View style={[styles.statusBar, { backgroundColor: '#E74C3C' }]} />
              </View>
            </View>
          </View>

          {/* Fleet Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fleet Status</Text>
            <View style={styles.fleetStatusContainer}>
              <View style={styles.fleetStatusItem}>
                <View style={[styles.fleetStatusCircle, { backgroundColor: '#27AE60' }]}>
                  <Text style={styles.fleetStatusNumber}>{stats.availableBikes}</Text>
                </View>
                <Text style={styles.fleetStatusLabel}>Available</Text>
              </View>
              <View style={styles.fleetStatusItem}>
                <View style={[styles.fleetStatusCircle, { backgroundColor: '#F39C12' }]}>
                  <Text style={styles.fleetStatusNumber}>{stats.rentedBikes}</Text>
                </View>
                <Text style={styles.fleetStatusLabel}>Rented</Text>
              </View>
              <View style={styles.fleetStatusItem}>
                <View style={[styles.fleetStatusCircle, { backgroundColor: '#E74C3C' }]}>
                  <Text style={styles.fleetStatusNumber}>{stats.maintenanceBikes}</Text>
                </View>
                <Text style={styles.fleetStatusLabel}>Maintenance</Text>
              </View>
            </View>
          </View>

          {/* Popular Bikes */}
          {popularBikes.length > 0 && <PopularBikesSection />}

          {/* Quick Insights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Insights</Text>
            <View style={styles.insightItem}>
              <Ionicons name="trending-up" size={20} color="#27AE60" />
              <Text style={styles.insightText}>
                Revenue has {getGrowthPercentage() >= 0 ? 'increased' : 'decreased'} by{' '}
                {Math.abs(getGrowthPercentage()).toFixed(1)}% this week
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Ionicons name="bicycle" size={20} color="#4ECDC4" />
              <Text style={styles.insightText}>
                {((stats.rentedBikes / (stats.totalBikes || 1)) * 100).toFixed(1)}% of your fleet is currently rented
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Ionicons name="people" size={20} color="#9B59B6" />
              <Text style={styles.insightText}>
                {stats.totalUsers} customers have registered on your platform
              </Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
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
    marginBottom: 15,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
  },
  activePeriodButton: {
    backgroundColor: '#4ECDC4',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activePeriodText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 20,
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
  growthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  chartContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    paddingBottom: 20,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '80%',
    borderRadius: 2,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 5,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  bookingStatusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    marginBottom: 10,
  },
  statusBar: {
    width: '80%',
    height: 4,
    borderRadius: 2,
  },
  fleetStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  fleetStatusItem: {
    alignItems: 'center',
  },
  fleetStatusCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fleetStatusNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  fleetStatusLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  popularBikeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  bikeInfo: {
    flex: 1,
    marginLeft: 15,
  },
  bikeModel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  bikeStats: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  performanceBar: {
    width: 60,
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  performanceBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  insightText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default AnalyticsScreen; 