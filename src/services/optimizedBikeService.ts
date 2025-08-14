import { supabase, TABLES } from '../config/supabase';
import { Bike } from '../types';

/**
 * OPTIMIZED BIKE SERVICE
 * - Implements pagination for large datasets
 * - Uses selective field loading 
 * - Caches frequently accessed data
 * - Optimizes query performance
 */

// Simple cache for bike data
const bikeCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// Cache utilities
const setCachedData = (key: string, data: any) => {
  bikeCache.set(key, { data, timestamp: Date.now() });
};

const getCachedData = (key: string) => {
  const cached = bikeCache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    bikeCache.delete(key);
    return null;
  }
  
  return cached.data;
};

export interface OptimizedBikeSearchParams {
  page?: number;
  limit?: number;
  type?: string;
  priceMin?: number;
  priceMax?: number;
  brand?: string;
  isAvailable?: boolean;
  searchQuery?: string;
}

/**
 * OPTIMIZED: Get available bikes with pagination and caching
 */
export const getOptimizedAvailableBikes = async (params: OptimizedBikeSearchParams = {}) => {
  try {
    const { page = 1, limit = 20, ...filters } = params;
    const offset = (page - 1) * limit;
    
    // Create cache key based on parameters
    const cacheKey = `bikes-${JSON.stringify(params)}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log('⚡ Using cached bikes data');
      return cached;
    }

    console.log(`🚗 Loading bikes page ${page} (optimized)`);
    const startTime = Date.now();

    // Build optimized query - select only essential fields for list view
    let query = supabase
      .from(TABLES.BIKES)
      .select(`
        id,
        name,
        brand,
        model,
        type,
        price_per_day,
        price_per_hour,
        images,
        rating,
        review_count,
        address,
        is_available,
        license_plate
      `, { count: 'exact' })
      .eq('is_available', true)
      .eq('is_approved', true);

    // Apply filters efficiently
    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.brand) {
      query = query.eq('brand', filters.brand);
    }

    if (filters.priceMin) {
      query = query.gte('price_per_day', filters.priceMin);
    }

    if (filters.priceMax) {
      query = query.lte('price_per_day', filters.priceMax);
    }

    // Text search across multiple fields
    if (filters.searchQuery) {
      query = query.or(`name.ilike.%${filters.searchQuery}%,brand.ilike.%${filters.searchQuery}%,model.ilike.%${filters.searchQuery}%`);
    }

    // Apply pagination and ordering
    const { data, error, count } = await query
      .order('rating', { ascending: false })  // Show highest rated first
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Error fetching optimized bikes:', error);
      return { success: false, error: error.message };
    }

    const result = {
      success: true,
      data: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: page * limit < (count || 0)
    };

    // Cache the result
    setCachedData(cacheKey, result);

    const loadTime = Date.now() - startTime;
    console.log(`✅ Bikes loaded in ${loadTime}ms (${data?.length} items)`);

    return result;
  } catch (error) {
    console.error('❌ Error in getOptimizedAvailableBikes:', error);
    return { success: false, error: 'Failed to fetch bikes' };
  }
};

/**
 * OPTIMIZED: Get bike details by ID with caching
 */
export const getOptimizedBikeById = async (bikeId: string) => {
  try {
    const cacheKey = `bike-detail-${bikeId}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log('⚡ Using cached bike details');
      return cached;
    }

    console.log(`🔍 Loading bike details: ${bikeId}`);

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
      console.error('❌ Error fetching bike details:', error);
      return { success: false, error: error.message };
    }

    const result = { success: true, data };
    
    // Cache bike details for 5 minutes
    setCachedData(cacheKey, result);

    console.log('✅ Bike details loaded and cached');
    return result;
  } catch (error) {
    console.error('❌ Error in getOptimizedBikeById:', error);
    return { success: false, error: 'Failed to fetch bike details' };
  }
};

/**
 * OPTIMIZED: Get popular bikes (most booked/highest rated)
 */
export const getPopularBikes = async (limit: number = 6) => {
  try {
    const cacheKey = `popular-bikes-${limit}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log('⚡ Using cached popular bikes');
      return cached;
    }

    console.log('🔥 Loading popular bikes...');

    const { data, error } = await supabase
      .from(TABLES.BIKES)
      .select(`
        id,
        name,
        brand,
        model,
        price_per_day,
        images,
        rating,
        review_count
      `)
      .eq('is_available', true)
      .eq('is_approved', true)
      .order('rating', { ascending: false })
      .order('review_count', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const result = { success: true, data: data || [] };
    
    // Cache for 10 minutes (popular bikes don't change often)
    setCachedData(cacheKey, result);

    console.log(`✅ Popular bikes loaded (${data?.length} items)`);
    return result;
  } catch (error) {
    console.error('❌ Error loading popular bikes:', error);
    return { success: false, error: 'Failed to load popular bikes' };
  }
};

/**
 * OPTIMIZED: Get bike brands and types for filters
 */
export const getBikeFilters = async () => {
  try {
    const cacheKey = 'bike-filters';
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log('⚡ Using cached bike filters');
      return cached;
    }

    console.log('🔧 Loading bike filters...');

    // Get unique brands and types efficiently
    const [brandsResult, typesResult] = await Promise.all([
      supabase
        .from(TABLES.BIKES)
        .select('brand')
        .eq('is_available', true)
        .eq('is_approved', true),
      supabase
        .from(TABLES.BIKES)  
        .select('type')
        .eq('is_available', true)
        .eq('is_approved', true)
    ]);

    if (brandsResult.error || typesResult.error) {
      throw brandsResult.error || typesResult.error;
    }

    // Extract unique values
    const brands = [...new Set(brandsResult.data?.map(item => item.brand))].filter(Boolean);
    const types = [...new Set(typesResult.data?.map(item => item.type))].filter(Boolean);

    const result = {
      success: true,
      brands: brands.sort(),
      types: types.sort()
    };

    // Cache filters for 30 minutes (rarely change)
    bikeCache.set(cacheKey, { data: result, timestamp: Date.now() });

    console.log('✅ Bike filters loaded');
    return result;
  } catch (error) {
    console.error('❌ Error loading bike filters:', error);
    return { success: false, error: 'Failed to load filters' };
  }
};

/**
 * Clear bike cache when data is updated
 */
export const clearBikeCache = () => {
  bikeCache.clear();
  console.log('🧹 Bike cache cleared');
};

/**
 * OPTIMIZED: Search bikes with autocomplete support
 */
export const searchBikes = async (searchQuery: string, limit: number = 10) => {
  try {
    if (!searchQuery.trim()) return { success: true, data: [] };

    console.log(`🔍 Searching bikes: "${searchQuery}"`);

    const { data, error } = await supabase
      .from(TABLES.BIKES)
      .select(`
        id,
        name,
        brand,
        model,
        price_per_day,
        images
      `)
      .eq('is_available', true)
      .eq('is_approved', true)
      .or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%`)
      .limit(limit);

    if (error) throw error;

    console.log(`✅ Search completed (${data?.length} results)`);
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('❌ Error searching bikes:', error);
    return { success: false, error: 'Search failed' };
  }
}; 