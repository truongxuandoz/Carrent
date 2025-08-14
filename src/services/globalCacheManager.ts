/**
 * GLOBAL CACHE MANAGER FOR HIGH TRAFFIC PRODUCTION
 * Multi-layer caching strategy with intelligent invalidation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { performanceMonitor } from '../utils/performanceOptimizer';

// ==================== CACHE LAYERS ====================

/**
 * L1 Cache: In-Memory (fastest, smallest)
 * For frequently accessed data that doesn't change often
 */
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number; accessCount: number }>();
  private maxSize = 200; // Limit memory usage
  private accessOrder: string[] = [];

  set(key: string, data: any, ttlMinutes: number = 10): void {
    // Evict oldest items if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
      accessCount: 0
    });

    this.updateAccessOrder(key);
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check TTL
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      return null;
    }

    // Update access statistics
    item.accessCount++;
    this.updateAccessOrder(key);

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  private evictLRU(): void {
    if (this.accessOrder.length > 0) {
      const oldest = this.accessOrder.shift()!;
      this.cache.delete(oldest);
    }
  }

  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  getStats(): { size: number; hitRate: number; totalAccess: number } {
    let totalAccess = 0;
    this.cache.forEach(item => totalAccess += item.accessCount);
    
    return {
      size: this.cache.size,
      hitRate: totalAccess > 0 ? (totalAccess / (totalAccess + this.cache.size)) : 0,
      totalAccess
    };
  }
}

/**
 * L2 Cache: Persistent Storage (slower, larger)
 * For data that should survive app restarts
 */
class PersistentCache {
  private keyPrefix = 'cache_';

  async set(key: string, data: any, ttlMinutes: number = 60): Promise<void> {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        ttl: ttlMinutes * 60 * 1000
      };
      
      await AsyncStorage.setItem(
        `${this.keyPrefix}${key}`, 
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      console.warn('PersistentCache set error:', error);
    }
  }

  async get(key: string): Promise<any | null> {
    try {
      const cached = await AsyncStorage.getItem(`${this.keyPrefix}${key}`);
      if (!cached) return null;

      const cacheItem = JSON.parse(cached);
      
      // Check TTL
      if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
        await this.delete(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('PersistentCache get error:', error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.keyPrefix}${key}`);
    } catch (error) {
      console.warn('PersistentCache delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.keyPrefix));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('PersistentCache clear error:', error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.keyPrefix));
      
      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          try {
            const cacheItem = JSON.parse(cached);
            if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
              await AsyncStorage.removeItem(key);
            }
          } catch {
            // Invalid cache item, remove it
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn('PersistentCache cleanup error:', error);
    }
  }
}

// ==================== CACHE STRATEGIES ====================

/**
 * Cache strategies for different data types
 */
export const CACHE_STRATEGIES = {
  // Static data (rarely changes)
  STATIC: { l1: 60, l2: 1440 }, // 1 hour L1, 24 hours L2
  
  // User data (changes occasionally)
  USER_DATA: { l1: 30, l2: 720 }, // 30 min L1, 12 hours L2
  
  // Bike listings (changes frequently)
  BIKE_DATA: { l1: 10, l2: 60 }, // 10 min L1, 1 hour L2
  
  // Dashboard stats (changes very frequently)
  DASHBOARD: { l1: 5, l2: 30 }, // 5 min L1, 30 min L2
  
  // Search results (highly dynamic)
  SEARCH: { l1: 2, l2: 15 }, // 2 min L1, 15 min L2
  
  // Popular content (moderate changes)
  POPULAR: { l1: 30, l2: 180 }, // 30 min L1, 3 hours L2
};

/**
 * Global Cache Manager
 */
class GlobalCacheManager {
  private memoryCache = new MemoryCache();
  private persistentCache = new PersistentCache();
  private metrics = {
    hits: 0,
    misses: 0,
    sets: 0
  };

  /**
   * Intelligent cache get with multi-layer fallback
   */
  async get<T>(key: string, strategy: keyof typeof CACHE_STRATEGIES = 'USER_DATA'): Promise<T | null> {
    const stopTimer = performanceMonitor.startTiming(`cache_get_${key}`);
    
    try {
      // Try L1 cache first (fastest)
      let data = this.memoryCache.get(key);
      if (data !== null) {
        this.metrics.hits++;
        console.log(`⚡ L1 cache hit: ${key}`);
        return data;
      }

      // Try L2 cache (persistent)
      data = await this.persistentCache.get(key);
      if (data !== null) {
        // Promote to L1 cache
        const ttl = CACHE_STRATEGIES[strategy].l1;
        this.memoryCache.set(key, data, ttl);
        this.metrics.hits++;
        console.log(`💾 L2 cache hit (promoted): ${key}`);
        return data;
      }

      this.metrics.misses++;
      console.log(`❌ Cache miss: ${key}`);
      return null;
    } finally {
      stopTimer();
    }
  }

  /**
   * Intelligent cache set with multi-layer storage
   */
  async set<T>(
    key: string, 
    data: T, 
    strategy: keyof typeof CACHE_STRATEGIES = 'USER_DATA'
  ): Promise<void> {
    const stopTimer = performanceMonitor.startTiming(`cache_set_${key}`);
    
    try {
      const strategyConfig = CACHE_STRATEGIES[strategy];
      
      // Set in both layers
      this.memoryCache.set(key, data, strategyConfig.l1);
      await this.persistentCache.set(key, data, strategyConfig.l2);
      
      this.metrics.sets++;
      console.log(`💾 Cache set: ${key} (strategy: ${strategy})`);
    } finally {
      stopTimer();
    }
  }

     /**
    * Smart cache invalidation
    */
   async invalidate(pattern: string): Promise<void> {
     console.log(`🗑️ Invalidating cache pattern: ${pattern}`);
     
     // Invalidate memory cache
     const memoryKeys = Array.from((this.memoryCache as any).cache.keys()) as string[];
     memoryKeys.forEach(key => {
       if (key.includes(pattern)) {
         this.memoryCache.delete(key);
       }
     });

    // Invalidate persistent cache
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.startsWith('cache_') && key.includes(pattern)
      );
      
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('Cache invalidation error:', error);
    }
  }

  /**
   * Cache warming for critical data
   */
  async warmUp(warmUpFunctions: Array<{ key: string; fn: () => Promise<any>; strategy: keyof typeof CACHE_STRATEGIES }>): Promise<void> {
    console.log('🔥 Starting cache warm-up...');
    
    const warmUpPromises = warmUpFunctions.map(async ({ key, fn, strategy }) => {
      try {
        // Check if already cached
        const cached = await this.get(key, strategy);
        if (cached !== null) {
          console.log(`⏭️ Skipping warm-up (already cached): ${key}`);
          return;
        }

        // Load and cache data
        console.log(`🔥 Warming up: ${key}`);
        const data = await fn();
        await this.set(key, data, strategy);
        console.log(`✅ Warmed up: ${key}`);
      } catch (error) {
        console.warn(`❌ Warm-up failed for ${key}:`, error);
      }
    });

    await Promise.allSettled(warmUpPromises);
    console.log('🔥 Cache warm-up completed');
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memory: any;
    metrics: { hits: number; misses: number; sets: number };
    hitRate: string;
  } {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? ((this.metrics.hits / total) * 100).toFixed(2) : '0';
    
    return {
      memory: this.memoryCache.getStats(),
      metrics: this.metrics,
      hitRate: `${hitRate}%`
    };
  }

  /**
   * Maintenance tasks
   */
  async maintenance(): Promise<void> {
    console.log('🧹 Running cache maintenance...');
    
    // Cleanup expired persistent cache items
    await this.persistentCache.cleanup();
    
    // Reset metrics if they get too large
    if (this.metrics.hits + this.metrics.misses > 10000) {
      this.metrics = { hits: 0, misses: 0, sets: 0 };
    }
    
    console.log('✅ Cache maintenance completed');
  }

  /**
   * Clear all caches (emergency)
   */
  async clearAll(): Promise<void> {
    console.log('🗑️ Clearing all caches...');
    this.memoryCache.clear();
    await this.persistentCache.clear();
    this.metrics = { hits: 0, misses: 0, sets: 0 };
    console.log('✅ All caches cleared');
  }
}

// ==================== CACHE HELPER FUNCTIONS ====================

/**
 * Helper function for cached method calls
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  strategy: keyof typeof CACHE_STRATEGIES = 'USER_DATA'
): Promise<T> {
  // Try cache first
  const cached = await globalCache.get<T>(key, strategy);
  if (cached !== null) {
    return cached;
  }

  // Execute function and cache result
  const result = await fn();
  await globalCache.set(key, result, strategy);
  
  return result;
}

// ==================== EXPORTS ====================

export const globalCache = new GlobalCacheManager();

// Auto-maintenance every 10 minutes
setInterval(() => {
  globalCache.maintenance();
}, 10 * 60 * 1000);

export { MemoryCache, PersistentCache, GlobalCacheManager };

console.log('🚀 Global cache manager initialized - ready for high traffic!'); 