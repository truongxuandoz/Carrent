import { supabase, TABLES } from '../config/supabase';
import { Booking } from '../types';

export interface CreateBookingData {
  bikeId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  deliveryType: 'pickup' | 'delivery';
  pickupLocation?: { lat: number; lng: number };
  pickupAddress?: string;
  deliveryLocation?: { lat: number; lng: number };
  deliveryAddress?: string;
  totalPrice: number;
  deposit: number;
  insurance?: number;
  deliveryFee?: number;
  paymentMethod?: 'vnpay' | 'momo' | 'zalopay' | 'cash' | 'card';
  notes?: string;
}

export interface BookingListParams {
  status?: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  customerId?: string;
  bikeId?: string;
  limit?: number;
  offset?: number;
}

class BookingService {
  // Create new booking
  async createBooking(bookingData: CreateBookingData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if bike is available for the requested period
      const conflictCheck = await supabase
        .from(TABLES.BOOKINGS)
        .select('id')
        .eq('bike_id', bookingData.bikeId)
        .in('status', ['confirmed', 'active'])
        .or(`start_date.lte.${bookingData.endDate},end_date.gte.${bookingData.startDate}`);

      if (conflictCheck.error) {
        return { success: false, error: 'Failed to check bike availability' };
      }

      if (conflictCheck.data && conflictCheck.data.length > 0) {
        return { success: false, error: 'Bike is not available for the selected dates' };
      }

      const insertData = {
        bike_id: bookingData.bikeId,
        customer_id: user.id,
        start_date: bookingData.startDate,
        end_date: bookingData.endDate,
        start_time: bookingData.startTime,
        end_time: bookingData.endTime,
        delivery_type: bookingData.deliveryType,
        pickup_location: bookingData.pickupLocation ? 
          `POINT(${bookingData.pickupLocation.lng} ${bookingData.pickupLocation.lat})` : null,
        pickup_address: bookingData.pickupAddress,
        delivery_location: bookingData.deliveryLocation ? 
          `POINT(${bookingData.deliveryLocation.lng} ${bookingData.deliveryLocation.lat})` : null,
        delivery_address: bookingData.deliveryAddress,
        total_price: bookingData.totalPrice,
        deposit: bookingData.deposit,
        insurance: bookingData.insurance || 0,
        delivery_fee: bookingData.deliveryFee || 0,
        payment_method: bookingData.paymentMethod,
        notes: bookingData.notes,
        status: 'pending',
        payment_status: 'pending',
      };

      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .insert([insertData])
        .select(`
          *,
          bike:bike_id(name, brand, model, price_per_day, price_per_hour),
          customer:customer_id(full_name, phone_number)
        `)
        .single();

      if (error) {
        console.error('Error creating booking:', error);
        return { success: false, error: error.message };
      }

      // Create notification for successful booking creation
      await this.createBookingNotification(user.id, 'booking_created', data.id, {
        bikeName: data.bike?.name || 'Unknown bike'
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error in createBooking:', error);
      return { success: false, error: 'Failed to create booking' };
    }
  }

  // Get user's bookings
  async getUserBookings(params?: BookingListParams) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      let query = supabase
        .from(TABLES.BOOKINGS)
        .select(`
          *,
          bike:bike_id(
            id, name, brand, model, images, license_plate,
            owner:owner_id(full_name, phone_number)
          )
        `)
        .eq('customer_id', user.id);

      // Apply filters
      if (params?.status) {
        query = query.eq('status', params.status);
      }

      if (params?.bikeId) {
        query = query.eq('bike_id', params.bikeId);
      }

      // Pagination
      if (params?.limit) {
        query = query.limit(params.limit);
      }

      if (params?.offset) {
        query = query.range(params.offset, (params.offset + (params.limit || 10)) - 1);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user bookings:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getUserBookings:', error);
      return { success: false, error: 'Failed to fetch bookings' };
    }
  }

  // Get booking by ID
  async getBookingById(bookingId: string) {
    try {
      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .select(`
          *,
          bike:bike_id(
            id, name, brand, model, year, type, color, license_plate, 
            images, price_per_day, price_per_hour, deposit, insurance,
            owner:owner_id(full_name, phone_number, avatar_url)
          ),
          customer:customer_id(full_name, phone_number, avatar_url),
          confirmed_by_user:confirmed_by(full_name)
        `)
        .eq('id', bookingId)
        .single();

      if (error) {
        console.error('Error fetching booking:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in getBookingById:', error);
      return { success: false, error: 'Failed to fetch booking details' };
    }
  }

  // Update booking status
  async updateBookingStatus(
    bookingId: string, 
    status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled',
    adminNotes?: string
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const updateData: any = { status };
      
      if (status === 'confirmed') {
        updateData.confirmed_by = user.id;
        updateData.confirmed_at = new Date().toISOString();
      }

      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }

      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .update(updateData)
        .eq('id', bookingId)
        .select(`
          *,
          bike:bike_id(name),
          customer:customer_id(full_name)
        `)
        .single();

      if (error) {
        console.error('Error updating booking status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateBookingStatus:', error);
      return { success: false, error: 'Failed to update booking status' };
    }
  }

  // Update payment status
  async updatePaymentStatus(
    bookingId: string, 
    paymentStatus: 'pending' | 'paid' | 'refunded',
    transactionId?: string
  ) {
    try {
      const updateData: any = { payment_status: paymentStatus };
      
      if (transactionId) {
        updateData.payment_transaction_id = transactionId;
      }

      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .update(updateData)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        console.error('Error updating payment status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in updatePaymentStatus:', error);
      return { success: false, error: 'Failed to update payment status' };
    }
  }

  // Admin: Get all bookings
  async getAllBookingsForAdmin(params?: BookingListParams) {
    try {
      let query = supabase
        .from(TABLES.BOOKINGS)
        .select(`
          *,
          bike:bike_id(
            id, name, brand, model, license_plate,
            owner:owner_id(full_name, phone_number)
          ),
          customer:customer_id(full_name, phone_number, email),
          confirmed_by_user:confirmed_by(full_name)
        `);

      // Apply filters
      if (params?.status) {
        query = query.eq('status', params.status);
      }

      if (params?.customerId) {
        query = query.eq('customer_id', params.customerId);
      }

      if (params?.bikeId) {
        query = query.eq('bike_id', params.bikeId);
      }

      // Pagination
      if (params?.limit) {
        query = query.limit(params.limit);
      }

      if (params?.offset) {
        query = query.range(params.offset, (params.offset + (params.limit || 10)) - 1);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all bookings:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getAllBookingsForAdmin:', error);
      return { success: false, error: 'Failed to fetch bookings' };
    }
  }

  // Cancel booking
  async cancelBooking(bookingId: string, reason?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if booking can be cancelled (only pending bookings)
      const { data: booking } = await supabase
        .from(TABLES.BOOKINGS)
        .select('status, customer_id')
        .eq('id', bookingId)
        .single();

      if (!booking) {
        return { success: false, error: 'Booking not found' };
      }

      if (booking.status !== 'pending') {
        return { success: false, error: 'Cannot cancel confirmed booking' };
      }

      const updateData: any = { 
        status: 'cancelled',
        admin_notes: reason || 'Cancelled by customer'
      };

      const { data, error } = await supabase
        .from(TABLES.BOOKINGS)
        .update(updateData)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        console.error('Error cancelling booking:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in cancelBooking:', error);
      return { success: false, error: 'Failed to cancel booking' };
    }
  }

  // Helper function to create notifications
  private async createBookingNotification(
    userId: string, 
    type: string, 
    bookingId: string, 
    extraData?: any
  ) {
    try {
      const notificationData = {
        user_id: userId,
        type,
        booking_id: bookingId,
        title: this.getNotificationTitle(type),
        message: this.getNotificationMessage(type, extraData),
        data: extraData || {},
      };

      await supabase
        .from(TABLES.NOTIFICATIONS)
        .insert([notificationData]);

    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  private getNotificationTitle(type: string): string {
    switch (type) {
      case 'booking_created':
        return 'Đặt xe thành công';
      case 'booking_confirmed':
        return 'Đơn hàng đã được xác nhận';
      case 'delivery_started':
        return 'Xe đang được giao';
      case 'booking_completed':
        return 'Hoàn thành chuyến thuê';
      case 'booking_cancelled':
        return 'Đơn hàng đã bị hủy';
      default:
        return 'Thông báo';
    }
  }

  private getNotificationMessage(type: string, extraData?: any): string {
    switch (type) {
      case 'booking_created':
        return `Đơn đặt xe ${extraData?.bikeName || ''} đã được tạo thành công. Chờ xác nhận từ admin.`;
      case 'booking_confirmed':
        return 'Admin đã xác nhận đơn đặt xe của bạn. Xe sẽ được giao trong thời gian sớm nhất.';
      case 'delivery_started':
        return 'Đối tác đang trên đường giao xe đến địa chỉ của bạn.';
      case 'booking_completed':
        return 'Bạn đã hoàn thành chuyến thuê xe. Cảm ơn bạn đã sử dụng dịch vụ!';
      case 'booking_cancelled':
        return 'Đơn đặt xe đã bị hủy. Vui lòng liên hệ hỗ trợ nếu có thắc mắc.';
      default:
        return 'Có thông báo mới cho bạn.';
    }
  }
}

export const bookingService = new BookingService();
export default bookingService; 