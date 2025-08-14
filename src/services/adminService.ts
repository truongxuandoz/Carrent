import { supabase } from '../config/supabase';
import { User } from '../types';

export interface AdminDashboardStats {
  totalUsers: number;
  totalBikes: number;
  activeBookings: number;
  todayRevenue: number;
  monthlyRevenue: number;
  availableBikes: number;
  rentedBikes: number;
  maintenanceBikes: number;
  pendingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
}

export interface BikeManagement {
  id: string;
  name: string;
  model: string;
  brand: string;
  year: number;
  type: string;
  color: string;
  licensePlate: string;
  condition: 'available' | 'rented' | 'maintenance' | 'retired';
  pricePerDay: number;
  pricePerHour: number;
  location: string;
  address: string;
  description: string;
  fuelType: string;
  transmission: string;
  engineCapacity: number;
  deposit: number;
  insurance: number;
  images: string[];
  features: string[];
  lastMaintenance: string;
  nextMaintenance: string;
  totalRentals: number;
  totalRevenue: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookingManagement {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  bikeId: string;
  bikeModel: string;
  bikeLicensePlate: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  pricePerDay: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  pickupLocation: string;
  returnLocation: string;
  notes: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserManagement extends User {
  totalBookings: number;
  totalSpent: number;
  lastBooking: string;
  accountStatus: 'active' | 'suspended' | 'blocked';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  joinedDate: string;
}

export interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
}

export interface PopularBike {
  id: string;
  model: string;
  rentals: number;
  revenue: number;
}

// Dashboard Stats
export const getDashboardStats = async (): Promise<AdminDashboardStats> => {
  try {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get total bikes
    const { count: totalBikes } = await supabase
      .from('bikes')
      .select('*', { count: 'exact', head: true });

    // Get active bookings
    const { count: activeBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['confirmed', 'active']);

    // Get pending bookings
    const { count: pendingBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get completed bookings
    const { count: completedBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    // Get cancelled bookings
    const { count: cancelledBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled');

    // Get bike status counts
    const { count: availableBikes } = await supabase
      .from('bikes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available');

    const { count: rentedBikes } = await supabase
      .from('bikes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rented');

    const { count: maintenanceBikes } = await supabase
      .from('bikes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'maintenance');

    // Get today's revenue
    const today = new Date().toISOString().split('T')[0];
    const { data: todayBookings } = await supabase
      .from('bookings')
      .select('total_amount')
      .eq('payment_status', 'paid')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    const todayRevenue = todayBookings?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;

    // Get monthly revenue
    const thisMonth = new Date();
    const firstDay = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const { data: monthlyBookings } = await supabase
      .from('bookings')
      .select('total_amount')
      .eq('payment_status', 'paid')
      .gte('created_at', `${firstDay}T00:00:00`)
      .lte('created_at', `${lastDay}T23:59:59`);

    const monthlyRevenue = monthlyBookings?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;

    return {
      totalUsers: totalUsers || 0,
      totalBikes: totalBikes || 0,
      activeBookings: activeBookings || 0,
      pendingBookings: pendingBookings || 0,
      completedBookings: completedBookings || 0,
      cancelledBookings: cancelledBookings || 0,
      availableBikes: availableBikes || 0,
      rentedBikes: rentedBikes || 0,
      maintenanceBikes: maintenanceBikes || 0,
      todayRevenue,
      monthlyRevenue,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// User Management
export const getAllUsers = async (page = 1, limit = 20, search?: string): Promise<{
  users: UserManagement[];
  total: number;
  hasMore: boolean;
}> => {
  try {
    console.log('🔍 Loading users - page:', page, 'search:', search);
    
    // First get users count for pagination
    let countQuery = supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
      
    if (search) {
      countQuery = countQuery.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }
    
    const { count } = await countQuery;
    console.log('📊 Total users found:', count);

    // Then get users with their booking data (LEFT JOIN instead of INNER)
    let query = supabase
      .from('users')
      .select(`
        *,
        bookings(
          id,
          total_amount,
          created_at,
          payment_status
        )
      `)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching users:', error);
      throw error;
    }

    console.log('✅ Users data loaded:', data?.length);

    const users: UserManagement[] = data?.map(user => {
      // Calculate booking stats
      const paidBookings = user.bookings?.filter((booking: any) => booking.payment_status === 'paid') || [];
      const totalBookings = user.bookings?.length || 0;
      const totalSpent = paidBookings.reduce((sum: number, booking: any) => sum + (booking.total_amount || 0), 0);
      const lastBooking = user.bookings?.length > 0 ? user.bookings[0].created_at : '';

      return {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phoneNumber: user.phone_number || '',
        role: user.role,
        isActive: user.is_active,
        totalBookings,
        totalSpent,
        lastBooking,
        accountStatus: user.account_status || (user.is_active ? 'active' : 'suspended'),
        verificationStatus: user.email_confirmed_at ? 'verified' : 'pending',
        joinedDate: user.created_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };
    }) || [];

    console.log('📋 Processed users:', users.length);

    return {
      users,
      total: count || 0,
      hasMore: (count || 0) > page * limit,
    };
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    throw error;
  }
};

export const updateUserStatus = async (userId: string, status: 'active' | 'suspended' | 'blocked'): Promise<void> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ 
        is_active: status === 'active',
        account_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

export const updateUserRole = async (userId: string, role: 'customer' | 'admin'): Promise<void> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ 
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Bike Management
export const getAllBikes = async (page = 1, limit = 20, status?: string): Promise<{
  bikes: BikeManagement[];
  total: number;
  hasMore: boolean;
}> => {
  try {
    let query = supabase
      .from('bikes')
      .select(`
        id, name, model, brand, year, type, color, license_plate, condition, price_per_day, price_per_hour, location, address, description, fuel_type, transmission, engine_capacity, deposit, insurance, features, images, last_maintenance, next_maintenance, created_at, updated_at,
        bookings(total_amount)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) {
      query = query.eq('condition', status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const bikes: BikeManagement[] = (data || []).map((bike: any) => {
      const bookings = Array.isArray(bike.bookings) ? bike.bookings : [];
      return {
        id: bike.id,
        name: bike.name || `${bike.brand} ${bike.model}`,
        model: bike.model,
        brand: bike.brand,
        year: bike.year,
        type: bike.type || 'scooter',
        color: bike.color || '',
        licensePlate: bike.license_plate,
        condition: bike.condition,
        pricePerDay: bike.price_per_day,
        pricePerHour: bike.price_per_hour || 0,
        location: bike.location,
        address: bike.address || bike.location || '',
        description: bike.description || '',
        fuelType: bike.fuel_type,
        transmission: bike.transmission,
        engineCapacity: bike.engine_capacity,
        deposit: bike.deposit || 0,
        insurance: bike.insurance || 0,
        features: bike.features || [],
        images: bike.images || [],
        lastMaintenance: bike.last_maintenance,
        nextMaintenance: bike.next_maintenance,
        totalRentals: bookings.length,
        totalRevenue: bookings.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0),
        createdAt: bike.created_at,
        updatedAt: bike.updated_at,
      } as BikeManagement;
    });

    return {
      bikes,
      total: count || 0,
      hasMore: (count || 0) > page * limit,
    };
  } catch (error) {
    console.error('Error fetching bikes:', error);
    throw error;
  }
};

export const createBike = async (bikeData: Omit<BikeManagement, 'id' | 'totalRentals' | 'totalRevenue' | 'createdAt' | 'updatedAt'>): Promise<BikeManagement> => {
  try {
    const { data, error } = await supabase
      .from('bikes')
      .insert([{
        model: bikeData.model,
        brand: bikeData.brand,
        year: bikeData.year,
        license_plate: bikeData.licensePlate,
        condition: bikeData.condition,
        price_per_day: bikeData.pricePerDay,
        location: bikeData.location,
        fuel_type: bikeData.fuelType,
        transmission: bikeData.transmission,
        engine_capacity: bikeData.engineCapacity,
        features: bikeData.features,
        images: bikeData.images,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name || `${data.brand} ${data.model}`,
      model: data.model,
      brand: data.brand,
      year: data.year,
      type: data.type || 'scooter',
      color: data.color || '',
      licensePlate: data.license_plate,
      condition: data.condition,
      pricePerDay: data.price_per_day,
      pricePerHour: data.price_per_hour || 0,
      location: data.location,
      address: data.address || data.location || '',
      description: data.description || '',
      fuelType: data.fuel_type,
      transmission: data.transmission,
      engineCapacity: data.engine_capacity,
      deposit: data.deposit || 0,
      insurance: data.insurance || 0,
      features: data.features,
      images: data.images,
      lastMaintenance: data.last_maintenance,
      nextMaintenance: data.next_maintenance,
      totalRentals: 0,
      totalRevenue: 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error creating bike:', error);
    throw error;
  }
};

export const updateBike = async (bikeId: string, bikeData: Partial<BikeManagement>): Promise<void> => {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Map frontend fields to database fields
    if (bikeData.model) updateData.model = bikeData.model;
    if (bikeData.brand) updateData.brand = bikeData.brand;
    if (bikeData.year) updateData.year = bikeData.year;
    if (bikeData.licensePlate) updateData.license_plate = bikeData.licensePlate;
    if (bikeData.condition) updateData.condition = bikeData.condition;
    if (bikeData.pricePerDay) updateData.price_per_day = bikeData.pricePerDay;
    if (bikeData.location) updateData.location = bikeData.location;
    if (bikeData.fuelType) updateData.fuel_type = bikeData.fuelType;
    if (bikeData.transmission) updateData.transmission = bikeData.transmission;
    if (bikeData.engineCapacity) updateData.engine_capacity = bikeData.engineCapacity;
    if (bikeData.features) updateData.features = bikeData.features;
    if (bikeData.condition) updateData.condition = bikeData.condition;
    if (bikeData.images) updateData.images = bikeData.images;
    if (bikeData.lastMaintenance) updateData.last_maintenance = bikeData.lastMaintenance;
    if (bikeData.nextMaintenance) updateData.next_maintenance = bikeData.nextMaintenance;

    const { error } = await supabase
      .from('bikes')
      .update(updateData)
      .eq('id', bikeId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating bike:', error);
    throw error;
  }
};

export const deleteBike = async (bikeId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('bikes')
      .delete()
      .eq('id', bikeId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting bike:', error);
    throw error;
  }
};

// Booking Management
export const getAllBookings = async (page = 1, limit = 20, status?: string): Promise<{
  bookings: BookingManagement[];
  total: number;
  hasMore: boolean;
}> => {
  try {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        users!inner(email, full_name, phone_number),
        bikes!inner(model, license_plate)
      `)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const bookings: BookingManagement[] = data?.map(booking => ({
      ...booking,
      userEmail: booking.users.email,
      userName: booking.users.full_name,
      userPhone: booking.users.phone_number,
      bikeModel: booking.bikes.model,
      bikeLicensePlate: booking.bikes.license_plate,
    })) || [];

    return {
      bookings,
      total: count || 0,
      hasMore: (count || 0) > page * limit,
    };
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
};

export const updateBookingStatus = async (bookingId: string, status: BookingManagement['status'], reason?: string): Promise<void> => {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (reason) {
      updateData.cancellation_reason = reason;
    }

    const { error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
};

// Analytics & Reports
export const getRevenueData = async (days = 30): Promise<RevenueData[]> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const { data, error } = await supabase
      .from('bookings')
      .select('created_at, total_amount')
      .eq('payment_status', 'paid')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const revenueMap = new Map<string, { revenue: number; bookings: number }>();
    
    data?.forEach(booking => {
      const date = booking.created_at.split('T')[0];
      const existing = revenueMap.get(date) || { revenue: 0, bookings: 0 };
      revenueMap.set(date, {
        revenue: existing.revenue + booking.total_amount,
        bookings: existing.bookings + 1,
      });
    });

    const result: RevenueData[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(endDate.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const data = revenueMap.get(dateStr) || { revenue: 0, bookings: 0 };
      result.unshift({
        date: dateStr,
        revenue: data.revenue,
        bookings: data.bookings,
      });
    }

    return result;
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    throw error;
  }
};

export const getPopularBikes = async (limit = 10): Promise<PopularBike[]> => {
  try {
    // First get bike rental counts and revenue using a proper join
    const { data, error } = await supabase
      .from('bikes')
      .select(`
        id,
        model,
        bookings!inner(total_amount, payment_status)
      `);

    if (error) throw error;

    // Process the data to calculate rentals and revenue per bike
    const bikeStats = new Map<string, { id: string; model: string; rentals: number; revenue: number }>();
    
    data?.forEach(bike => {
      const key = bike.id;
      if (!bikeStats.has(key)) {
        bikeStats.set(key, {
          id: bike.id,
          model: bike.model,
          rentals: 0,
          revenue: 0
        });
      }
      
      const stats = bikeStats.get(key)!;
      if (Array.isArray(bike.bookings)) {
        bike.bookings.forEach((booking: any) => {
          stats.rentals += 1;
          if (booking.payment_status === 'paid') {
            stats.revenue += booking.total_amount || 0;
          }
        });
      }
    });

    // Convert to array and sort by rentals
    const result = Array.from(bikeStats.values())
      .sort((a, b) => b.rentals - a.rentals)
      .slice(0, limit);

    return result;
  } catch (error) {
    console.error('Error fetching popular bikes:', error);
    // Return empty array if there's an error instead of throwing
    return [];
  }
};

// Notifications
export const sendNotificationToUser = async (userId: string, title: string, message: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        title,
        message,
        type: 'admin',
        created_at: new Date().toISOString(),
      }]);

    if (error) throw error;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

export const sendBroadcastNotification = async (title: string, message: string): Promise<void> => {
  try {
    // Get all active users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('is_active', true);

    if (usersError) throw usersError;

    // Send notification to all users
    const notifications = users?.map(user => ({
      user_id: user.id,
      title,
      message,
      type: 'broadcast',
      created_at: new Date().toISOString(),
    })) || [];

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) throw error;
  } catch (error) {
    console.error('Error sending broadcast notification:', error);
    throw error;
  }
}; 