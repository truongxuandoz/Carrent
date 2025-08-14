import { supabase, TABLES } from '../config/supabase';
import { Bike } from '../types';

export interface BikeSearchParams {
  location?: { lat: number; lng: number; radius?: number };
  type?: string;
  priceMin?: number;
  priceMax?: number;
  brand?: string;
  isAvailable?: boolean;
}

export interface CreateBikeData {
  name: string;
  brand: string;
  model: string;
  year: number;
  type: 'scooter' | 'manual' | 'sport' | 'electric';
  engineCapacity?: number;
  fuelType: 'gasoline' | 'electric';
  transmission: 'automatic' | 'manual';
  condition: 'available' | 'rented' | 'maintenance' | 'retired';
  color: string;
  licensePlate: string;
  images?: string[];
  pricePerDay: number;
  location?: { lat: number; lng: number };
}

class BikeService {
  // Get all available bikes
  async getAvailableBikes(params?: BikeSearchParams) {
    try {
      let query = supabase
        .from(TABLES.BIKES)
        .select(`
          *,
          owner:owner_id(id, full_name, phone_number)
        `)
        .eq('is_available', true);

      // Apply filters
      if (params?.type) {
        query = query.eq('type', params.type);
      }

      if (params?.brand) {
        query = query.eq('brand', params.brand);
      }

      if (params?.priceMin) {
        query = query.gte('price_per_day', params.priceMin);
      }

      if (params?.priceMax) {
        query = query.lte('price_per_day', params.priceMax);
      }

      // Location-based search (if location provided)
      // Note: Location search with PostGIS requires custom SQL function
      // For now, we'll skip location filtering until PostGIS functions are set up
      if (params?.location) {
        // TODO: Implement location-based search with PostGIS
        console.log('Location search not yet implemented:', params.location);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bikes:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getAvailableBikes:', error);
      return { success: false, error: 'Failed to fetch bikes' };
    }
  }

  // Get bike by ID
  async getBikeById(bikeId: string) {
    try {
      const { data, error } = await supabase
        .from(TABLES.BIKES)
        .select(`
          *,
          owner:owner_id(id, full_name, phone_number, avatar_url),
          reviews(
            id,
            rating,
            comment,
            created_at,
            customer:customer_id(full_name, avatar_url)
          )
        `)
        .eq('id', bikeId)
        .single();

      if (error) {
        console.error('Error fetching bike:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in getBikeById:', error);
      return { success: false, error: 'Failed to fetch bike details' };
    }
  }

  // Create new bike
  async createBike(bikeData: CreateBikeData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const insertData = {
        name: bikeData.name,
        brand: bikeData.brand,
        model: bikeData.model,
        year: bikeData.year,
        type: bikeData.type,
        engine_capacity: bikeData.engineCapacity,
        fuel_type: bikeData.fuelType,
        transmission: bikeData.transmission,
        condition: bikeData.condition,
        color: bikeData.color,
        license_plate: bikeData.licensePlate,
        images: bikeData.images || [],
        price_per_day: bikeData.pricePerDay,
        location: bikeData.location ? `POINT(${bikeData.location.lng} ${bikeData.location.lat})` : null,
        is_available: true
        // Skip owner_id for now until user profile is properly created
      };

      const { data, error } = await supabase
        .from(TABLES.BIKES)
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Error creating bike:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in createBike:', error);
      return { success: false, error: 'Failed to create bike' };
    }
  }

  // Update bike
  async updateBike(bikeId: string, bikeData: Partial<CreateBikeData>) {
    try {
      const updateData: any = {};
      
      if (bikeData.name) updateData.name = bikeData.name;
      if (bikeData.brand) updateData.brand = bikeData.brand;
      if (bikeData.model) updateData.model = bikeData.model;
      if (bikeData.year) updateData.year = bikeData.year;
      if (bikeData.type) updateData.type = bikeData.type;
      if (bikeData.engineCapacity) updateData.engine_capacity = bikeData.engineCapacity;
      if (bikeData.fuelType) updateData.fuel_type = bikeData.fuelType;
      if (bikeData.transmission) updateData.transmission = bikeData.transmission;
      if (bikeData.condition) updateData.condition = bikeData.condition;
      if (bikeData.color) updateData.color = bikeData.color;
      if (bikeData.licensePlate) updateData.license_plate = bikeData.licensePlate;
      if (bikeData.images) updateData.images = bikeData.images;
      if (bikeData.pricePerDay) updateData.price_per_day = bikeData.pricePerDay;
      if (bikeData.location) {
        updateData.location = `POINT(${bikeData.location.lng} ${bikeData.location.lat})`;
      }

      const { data, error } = await supabase
        .from(TABLES.BIKES)
        .update(updateData)
        .eq('id', bikeId)
        .select()
        .single();

      if (error) {
        console.error('Error updating bike:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateBike:', error);
      return { success: false, error: 'Failed to update bike' };
    }
  }

  // Get bikes by owner
  async getBikesByOwner() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from(TABLES.BIKES)
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching owner bikes:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getBikesByOwner:', error);
      return { success: false, error: 'Failed to fetch your bikes' };
    }
  }

  // Admin: Get all bikes (pending approval)
  async getAllBikesForAdmin() {
    try {
      const { data, error } = await supabase
        .from(TABLES.BIKES)
        .select(`
          *,
          owner:owner_id(id, full_name, phone_number, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all bikes:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getAllBikesForAdmin:', error);
      return { success: false, error: 'Failed to fetch bikes' };
    }
  }

  // Admin: Create new bike (auto-approved)
  async createBikeForAdmin(bikeData: CreateBikeData) {
    try {
      console.log('🔄 Creating new bike (Admin):', bikeData.name);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const insertData = {
        name: bikeData.name,
        brand: bikeData.brand,
        model: bikeData.model,
        year: bikeData.year,
        type: bikeData.type,
        engine_capacity: bikeData.engineCapacity,
        fuel_type: bikeData.fuelType,
        transmission: bikeData.transmission,
        condition: bikeData.condition,
        color: bikeData.color,
        license_plate: bikeData.licensePlate,
        images: bikeData.images || [],
        price_per_day: bikeData.pricePerDay,
        location: bikeData.location ? `POINT(${bikeData.location.lng} ${bikeData.location.lat})` : null,
        is_available: true,
        is_approved: true, // Auto-approve bikes created by admin
        rating: 0,
        review_count: 0,
        // Skip owner_id for now until user profile system is properly set up
      };

      const { data, error } = await supabase
        .from(TABLES.BIKES)
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating bike (Admin):', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Bike created successfully by admin:', data.name);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error in createBikeForAdmin:', error);
      return { success: false, error: 'Failed to create bike' };
    }
  }

  // Admin: Update bike availability (simplified - no approval needed)
  async updateBikeStatus(bikeId: string, isAvailable: boolean) {
    try {
      const { data, error } = await supabase
        .from(TABLES.BIKES)
        .update({ is_available: isAvailable })
        .eq('id', bikeId)
        .select()
        .single();

      if (error) {
        console.error('Error updating bike status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateBikeStatus:', error);
      return { success: false, error: 'Failed to update bike status' };
    }
  }
}

export const bikeService = new BikeService();
export default bikeService; 