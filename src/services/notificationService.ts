import { supabase, TABLES } from '../config/supabase';

export interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'welcome' | 'login' | 'booking_created' | 'booking_confirmed' | 'delivery_started' | 'booking_completed' | 'booking_cancelled' | 'system';
  data?: any;
}

class NotificationService {
  // Tạo notification mới
  async createNotification(notificationData: CreateNotificationData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .insert([
          {
            user_id: notificationData.userId,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type,
            data: notificationData.data || {},
            is_read: false,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in createNotification:', error);
      return { success: false, error: 'Failed to create notification' };
    }
  }

  // Tạo notification chào mừng khi đăng ký
  async createWelcomeNotification(userId: string, userName: string) {
    return this.createNotification({
      userId,
      title: '🎉 Chào mừng đến với CarRent!',
      message: `Xin chào ${userName}! Cảm ơn bạn đã đăng ký tài khoản. Hãy khám phá và thuê xe ngay hôm nay!`,
      type: 'welcome',
      data: { isWelcome: true }
    });
  }

  // Tạo notification khi đăng nhập
  async createLoginNotification(userId: string, userName: string) {
    const now = new Date();
    const timeString = now.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const dateString = now.toLocaleDateString('vi-VN');

    return this.createNotification({
      userId,
      title: '👋 Chào mừng trở lại!',
      message: `Xin chào ${userName}! Bạn đã đăng nhập thành công lúc ${timeString} ngày ${dateString}.`,
      type: 'login',
      data: { 
        loginTime: now.toISOString(),
        device: 'mobile' 
      }
    });
  }

  // Lấy notifications của user
  async getUserNotifications(userId: string, limit: number = 20) {
    try {
      const { data, error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notifications:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getUserNotifications:', error);
      return { success: false, error: 'Failed to fetch notifications' };
    }
  }

  // Đánh dấu notification đã đọc
  async markAsRead(notificationId: string) {
    try {
      const { data, error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) {
        console.error('Error marking notification as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return { success: false, error: 'Failed to mark as read' };
    }
  }

  // Đánh dấu tất cả notifications đã đọc
  async markAllAsRead(userId: string) {
    try {
      const { data, error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return { success: false, error: 'Failed to mark all as read' };
    }
  }

  // Đếm số notifications chưa đọc
  async getUnreadCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error getting unread count:', error);
        return { success: false, error: error.message };
      }

      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return { success: false, error: 'Failed to get unread count' };
    }
  }

  // Subscribe to real-time notifications
  subscribeToNotifications(userId: string, callback: (notification: any) => void) {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('New notification received:', payload.new);
          callback(payload.new);
        }
      )
      .subscribe();

    return subscription;
  }
}

export const notificationService = new NotificationService();
export default notificationService; 