/**
 * COMPREHENSIVE REACT NATIVE PERFORMANCE OPTIMIZER
 * For high-traffic production apps
 */

import { InteractionManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==================== MEMORY MANAGEMENT ====================

/**
 * Memory-efficient image handler
 */
export const optimizeImageForDisplay = (imageUri: string, width: number, height: number) => {
  // For high traffic, always resize images to exact dimensions needed
  if (!imageUri) return require('../assets/placeholder-bike.png');
  
  // Use optimized image URLs with query parameters for resizing
  if (imageUri.startsWith('http')) {
    return `${imageUri}?w=${width}&h=${height}&fit=cover&auto=format,compress`;
  }
  
  return imageUri;
};

/**
 * Debounced search to reduce API calls
 */
export const createDebouncedSearch = (searchFn: Function, delay: number = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => searchFn(...args), delay);
  };
};

/**
 * Throttled function calls to prevent spam
 */
export const createThrottledFunction = (fn: Function, limit: number = 1000) => {
  let lastCall = 0;
  
  return (...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      return fn(...args);
    }
  };
};

// ==================== STATE MANAGEMENT OPTIMIZATION ====================

/**
 * Memoized selector for complex state
 */
export const createMemoizedSelector = <T, R>(
  selector: (state: T) => R,
  equalityFn: (a: R, b: R) => boolean = (a, b) => a === b
) => {
  let lastState: T;
  let lastResult: R;
  
  return (state: T): R => {
    if (state !== lastState) {
      const newResult = selector(state);
      if (!equalityFn(newResult, lastResult)) {
        lastResult = newResult;
      }
      lastState = state;
    }
    return lastResult;
  };
};

/**
 * Optimized list renderer for large datasets
 */
export const LIST_OPTIMIZATION_CONFIG = {
  // Render items outside screen for smooth scrolling
  initialNumToRender: 10,
  maxToRenderPerBatch: 5,
  windowSize: 10,
  removeClippedSubviews: true,
  // Optimize for high-frequency updates
  updateCellsBatchingPeriod: 50,
  getItemLayout: (data: any[], index: number) => ({
    length: 120, // Fixed item height
    offset: 120 * index,
    index,
  }),
};

// ==================== NETWORK OPTIMIZATION ====================

/**
 * Request queue to prevent overwhelming server
 */
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private maxConcurrent = 3; // Limit concurrent requests

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.running++;
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      });
      
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.running < this.maxConcurrent && this.queue.length > 0) {
      const nextRequest = this.queue.shift()!;
      nextRequest();
    }
  }
}

export const requestQueue = new RequestQueue();

/**
 * Optimized API caller with retry and caching
 */
export const optimizedApiCall = async <T>(
  key: string,
  apiCall: () => Promise<T>,
  cacheTTL: number = 5 * 60 * 1000 // 5 minutes default
): Promise<T> => {
  // Check cache first
  try {
    const cached = await AsyncStorage.getItem(`api_cache_${key}`);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < cacheTTL) {
        console.log(`⚡ Cache hit for ${key}`);
        return data;
      }
    }
  } catch (error) {
    console.log('Cache read error:', error);
  }

  // Make API call with retry logic
  return requestQueue.add(async () => {
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🌐 API call ${key} (attempt ${attempt})`);
        const result = await apiCall();
        
        // Cache successful result
        try {
          await AsyncStorage.setItem(`api_cache_${key}`, JSON.stringify({
            data: result,
            timestamp: Date.now()
          }));
        } catch (cacheError) {
          console.log('Cache write error:', cacheError);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        if (attempt < 3) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
      }
    }
    throw lastError;
  });
};

// ==================== UI OPTIMIZATION ====================

/**
 * Optimized interaction handler
 */
export const optimizedInteraction = (callback: () => void) => {
  InteractionManager.runAfterInteractions(() => {
    // Run after animations/gestures complete
    callback();
  });
};

/**
 * Platform-specific optimizations
 */
export const PLATFORM_OPTIMIZATIONS = {
  android: {
    // Android-specific optimizations
    useNativeDriver: true,
    enableHermes: true,
    proguardEnabled: true,
  },
  ios: {
    // iOS-specific optimizations  
    useNativeDriver: true,
    flipperEnabled: false, // Disable in production
    deadCodeStripping: true,
  }
};

// ==================== PERFORMANCE MONITORING ====================

/**
 * Performance metrics collector
 */
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  startTiming(key: string): () => void {
    const start = Date.now();
    
    return () => {
      const duration = Date.now() - start;
      this.recordMetric(key, duration);
    };
  }

  recordMetric(key: string, value: number) {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const values = this.metrics.get(key)!;
    values.push(value);
    
    // Keep only last 100 values to prevent memory bloat
    if (values.length > 100) {
      values.splice(0, values.length - 100);
    }
  }

  getAverageTime(key: string): number {
    const values = this.metrics.get(key);
    if (!values || values.length === 0) return 0;
    
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  getMetricsSummary(): Record<string, { avg: number; count: number; latest: number }> {
    const summary: Record<string, { avg: number; count: number; latest: number }> = {};
    
    this.metrics.forEach((values, key) => {
      summary[key] = {
        avg: this.getAverageTime(key),
        count: values.length,
        latest: values[values.length - 1] || 0
      };
    });
    
    return summary;
  }

  // Report performance issues
  checkPerformanceIssues() {
    const summary = this.getMetricsSummary();
    const issues: string[] = [];
    
    Object.entries(summary).forEach(([key, stats]) => {
      if (stats.avg > 2000) { // Slower than 2 seconds
        issues.push(`${key}: avg ${stats.avg.toFixed(0)}ms (slow)`);
      }
    });
    
    if (issues.length > 0) {
      console.warn('⚠️ Performance issues detected:', issues);
    }
    
    return issues;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// ==================== CACHE MANAGEMENT ====================

/**
 * Advanced cache with size limits and TTL
 */
class AdvancedCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize = 100; // Limit cache size
  private accessOrder: string[] = []; // LRU tracking

  set(key: string, data: any, ttlMinutes: number = 5): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldest = this.accessOrder.shift();
      if (oldest) {
        this.cache.delete(oldest);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });

    // Update access order
    const existingIndex = this.accessOrder.indexOf(key);
    if (existingIndex > -1) {
      this.accessOrder.splice(existingIndex, 1);
    }
    this.accessOrder.push(key);
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check TTL
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      return null;
    }

    // Update access order (move to end)
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
      this.accessOrder.push(key);
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0 // Would need hit/miss tracking for accurate rate
    };
  }
}

export const advancedCache = new AdvancedCache();

// ==================== EXPORT OPTIMIZATIONS ====================

export const PRODUCTION_OPTIMIZATIONS = {
  // Bundle optimization
  bundleOptimization: {
    enableHermes: true,
    enableProguard: true,
    shrinkResources: true,
    minifyEnabled: true,
  },
  
  // Network optimization
  networkOptimization: {
    connectionTimeout: 10000,
    readTimeout: 15000,
    retryAttempts: 3,
    maxConcurrentRequests: 3,
  },
  
  // Memory optimization
  memoryOptimization: {
    largeHeap: true,
    removeClippedSubviews: true,
    maxMemoryUsage: 256, // MB
  },
  
  // UI optimization
  uiOptimization: {
    useNativeDriver: true,
    enableBatching: true,
    scrollEventThrottle: 16,
  }
};

console.log('🚀 Performance optimizer loaded - ready for production scale!'); 