import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';

type NotificationsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface NotificationItem {
  id: string;
  type: 'booking_created' | 'booking_confirmed' | 'delivery_started' | 'booking_completed' | 'booking_cancelled';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  bookingId?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const NotificationsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NotificationsScreenNavigationProp>();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    
    // Subscribe to real-time notifications
    let subscription: any;
    if (user?.id) {
      subscription = notificationService.subscribeToNotifications(
        user.id,
        (newNotification) => {
          setNotifications(prev => [transformNotification(newNotification), ...prev]);
        }
      );
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [user?.id]);

  const loadNotifications = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const result = await notificationService.getUserNotifications(user.id);
      if (result.success && result.data) {
        const transformedNotifications = result.data.map(transformNotification);
        setNotifications(transformedNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const transformNotification = (notification: any): NotificationItem => {
    const getIconAndColor = (type: string) => {
      switch (type) {
        case 'welcome':
          return { icon: 'heart', color: '#e91e63' };
        case 'login':
          return { icon: 'log-in', color: '#2196f3' };
        case 'booking_created':
          return { icon: 'checkmark-circle', color: '#28a745' };
        case 'booking_confirmed':
          return { icon: 'shield-checkmark', color: '#007AFF' };
        case 'delivery_started':
          return { icon: 'car', color: '#FF9500' };
        case 'booking_completed':
          return { icon: 'trophy', color: '#28a745' };
        case 'booking_cancelled':
          return { icon: 'close-circle', color: '#dc3545' };
        default:
          return { icon: 'notifications', color: '#666' };
      }
    };

    const { icon, color } = getIconAndColor(notification.type);
    
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      timestamp: notification.created_at,
      isRead: notification.is_read,
      bookingId: notification.booking_id,
      icon: icon as keyof typeof Ionicons.glyphMap,
      color,
    };
  };

  const filteredNotifications = notifications.filter(notification => {
    if (selectedTab === 'unread') return !notification.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  const handleNotificationPress = async (notification: NotificationItem) => {
    // Mark as read
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification.id);
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }

    // Navigate to booking detail if available
    if (notification.bookingId) {
      navigation.navigate('BookingDetailView', { 
        bookingId: notification.bookingId 
      });
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    
    try {
      const result = await notificationService.markAllAsRead(user.id);
      if (result.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity 
      style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.notificationHeader}>
        <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
          <Ionicons name={item.icon} size={20} color="#fff" />
        </View>
        
        <View style={styles.notificationContent}>
          <View style={styles.titleRow}>
            <Text style={[styles.notificationTitle, !item.isRead && styles.unreadTitle]}>
              {item.title}
            </Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          
          <Text style={styles.timestamp}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('notifications.notifications')}</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllRead}>{t('notifications.markAllRead')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Filter */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'all' && styles.tabButtonActive,
          ]}
          onPress={() => setSelectedTab('all')}
        >
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === 'all' && styles.tabButtonTextActive,
            ]}
          >
            {t('notifications.all')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'unread' && styles.tabButtonActive,
          ]}
          onPress={() => setSelectedTab('unread')}
        >
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === 'unread' && styles.tabButtonTextActive,
            ]}
          >
            {t('notifications.unread')} ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>
              {selectedTab === 'unread' 
                ? t('notifications.noUnreadNotifications')
                : t('notifications.noNotifications')
              }
            </Text>
            <Text style={styles.emptyText}>
              {t('notifications.notificationsWillAppear')}
            </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  markAllRead: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  tabButtonActive: {
    backgroundColor: '#007AFF',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 20,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationsScreen; 