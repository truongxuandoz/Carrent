/**
 * PRODUCTION MONITORING SYSTEM FOR HIGH TRAFFIC
 * Real-time performance monitoring, alerting, and analytics
 */

import { Alert, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { performanceMonitor } from './performanceOptimizer';
import { globalCache } from '../services/globalCacheManager';

// ==================== PERFORMANCE MONITORING ====================

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'network' | 'ui' | 'memory' | 'database' | 'cache';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SystemHealth {
  cpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
  cacheHitRate: number;
  errorRate: number;
  crashRate: number;
}

class ProductionMonitor {
  private metrics: PerformanceMetric[] = [];
  private alerts: Array<{ message: string; timestamp: number; severity: string }> = [];
  private isMonitoring = false;
  private monitoringInterval?: ReturnType<typeof setInterval>;
  private appStateSubscription?: any;
  private appStartTime = Date.now();
  private errorCount = 0;
  private sessionStartTime = Date.now();

  // Thresholds for performance alerts
  private thresholds = {
    networkLatency: 2000, // 2 seconds
    memoryUsage: 500, // 500MB
    cacheHitRate: 0.7, // 70%
    errorRate: 0.05, // 5%
    responseTime: 3000, // 3 seconds
  };

  /**
   * Start monitoring system performance
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    console.log('🔍 Starting production monitoring...');
    this.isMonitoring = true;
    this.sessionStartTime = Date.now();

    // Monitor app state changes
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

    // Start periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds

    // Monitor network requests
    this.interceptNetworkRequests();

    // Monitor memory usage
    this.monitorMemoryUsage();

    console.log('✅ Production monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    console.log('⏹️ Stopping production monitoring...');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    console.log('✅ Production monitoring stopped');
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    category: PerformanceMetric['category'] = 'ui',
    severity: PerformanceMetric['severity'] = 'low'
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      category,
      severity
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory bloat
    if (this.metrics.length > 1000) {
      this.metrics.splice(0, 500);
    }

    // Check for performance issues
    this.checkPerformanceThresholds(metric);

    // Log critical metrics
    if (severity === 'critical' || severity === 'high') {
      console.warn(`⚠️ Performance issue: ${name} = ${value} (${severity})`);
    }
  }

  /**
   * Record an error for monitoring
   */
  recordError(error: Error | string, context?: string): void {
    this.errorCount++;
    
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorContext = context || 'Unknown';
    
    console.error(`❌ Error recorded: ${errorMessage} in ${errorContext}`);
    
    // Record error metric
    this.recordMetric(
      `error_${errorContext}`,
      1,
      'ui',
      'high'
    );

    // Store error for analytics
    this.storeErrorForAnalytics(errorMessage, errorContext);
  }

  /**
   * Collect system-wide metrics
   */
  private async collectSystemMetrics(): Promise<void> {
    try {
      // Network latency test
      const networkLatency = await this.measureNetworkLatency();
      this.recordMetric('network_latency', networkLatency, 'network');

      // Cache performance
      const cacheStats = globalCache.getStats();
      const hitRate = parseFloat(cacheStats.hitRate.replace('%', '')) / 100;
      this.recordMetric('cache_hit_rate', hitRate, 'cache');

      // Memory usage (estimated)
      const memoryMetrics = await this.estimateMemoryUsage();
      this.recordMetric('memory_usage', memoryMetrics.estimated, 'memory');

      // Error rate
      const sessionDuration = (Date.now() - this.sessionStartTime) / 1000 / 60; // minutes
      const errorRate = this.errorCount / Math.max(sessionDuration, 1);
      this.recordMetric('error_rate', errorRate, 'ui');

      console.log(`📊 System metrics collected - Latency: ${networkLatency}ms, Cache: ${cacheStats.hitRate}, Errors: ${errorRate.toFixed(2)}/min`);
    } catch (error) {
      console.warn('⚠️ Failed to collect system metrics:', error);
    }
  }

  /**
   * Measure network latency
   */
  private async measureNetworkLatency(): Promise<number> {
    const start = Date.now();
    
    try {
      // Simple ping to a fast endpoint
      await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      return Date.now() - start;
    } catch (error) {
      console.warn('Network latency test failed:', error);
      return 9999; // High latency to indicate network issues
    }
  }

  /**
   * Estimate memory usage
   */
  private async estimateMemoryUsage(): Promise<{ estimated: number; jsHeapSize?: number }> {
    try {
      // Try to get actual memory info if available
      if ((global as any).performance?.memory) {
        const memory = (global as any).performance.memory;
        return {
          estimated: memory.usedJSHeapSize / 1024 / 1024, // Convert to MB
          jsHeapSize: memory.usedJSHeapSize
        };
      }

      // Fallback estimation based on cache size and metrics
      const cacheStats = globalCache.getStats();
      const metricsSize = this.metrics.length * 100; // Rough estimate
      const estimatedMB = (cacheStats.memory.size * 10 + metricsSize) / 1024; // Very rough estimate

      return { estimated: estimatedMB };
    } catch (error) {
      console.warn('Memory estimation failed:', error);
      return { estimated: 0 };
    }
  }

  /**
   * Check performance thresholds and alert if needed
   */
  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    let shouldAlert = false;
    let alertMessage = '';

    switch (metric.name) {
      case 'network_latency':
        if (metric.value > this.thresholds.networkLatency) {
          shouldAlert = true;
          alertMessage = `High network latency: ${metric.value}ms`;
        }
        break;
      
      case 'memory_usage':
        if (metric.value > this.thresholds.memoryUsage) {
          shouldAlert = true;
          alertMessage = `High memory usage: ${metric.value.toFixed(2)}MB`;
        }
        break;
      
      case 'cache_hit_rate':
        if (metric.value < this.thresholds.cacheHitRate) {
          shouldAlert = true;
          alertMessage = `Low cache hit rate: ${(metric.value * 100).toFixed(1)}%`;
        }
        break;
      
      case 'error_rate':
        if (metric.value > this.thresholds.errorRate) {
          shouldAlert = true;
          alertMessage = `High error rate: ${metric.value.toFixed(2)} errors/min`;
        }
        break;
    }

    if (shouldAlert) {
      this.createAlert(alertMessage, metric.severity);
    }
  }

  /**
   * Create performance alert
   */
  private createAlert(message: string, severity: PerformanceMetric['severity']): void {
    const alert = {
      message,
      timestamp: Date.now(),
      severity
    };

    this.alerts.push(alert);

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts.splice(0, 25);
    }

    // Log critical alerts
    if (severity === 'critical') {
      console.error(`🚨 CRITICAL ALERT: ${message}`);
      
      // In production, you might want to send this to your monitoring service
      // this.sendToMonitoringService(alert);
    }
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'active') {
      console.log('📱 App became active - resuming full monitoring');
      this.recordMetric('app_state_active', 1, 'ui');
    } else if (nextAppState === 'background') {
      console.log('📱 App went to background - reducing monitoring');
      this.recordMetric('app_state_background', 1, 'ui');
    }
  }

  /**
   * Intercept network requests for monitoring
   */
  private interceptNetworkRequests(): void {
    // Monitor fetch requests
    const originalFetch = global.fetch;
    global.fetch = async (...args) => {
      const startTime = Date.now();
      
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        this.recordMetric(
          'api_request_duration',
          duration,
          'network',
          duration > 5000 ? 'high' : 'low'
        );

        if (!response.ok) {
          this.recordMetric('api_request_error', response.status, 'network', 'medium');
        }

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.recordMetric('api_request_failed', duration, 'network', 'high');
        this.recordError(error as Error, 'network_request');
        throw error;
      }
    };
  }

  /**
   * Monitor memory usage patterns
   */
  private monitorMemoryUsage(): void {
    // Set up memory pressure monitoring
    if ('memory' in navigator) {
      // @ts-ignore - This is a newer API
      const memoryInfo = (navigator as any).memory;
      if (memoryInfo) {
        setInterval(() => {
          this.recordMetric(
            'js_heap_size',
            memoryInfo.usedJSHeapSize / 1024 / 1024,
            'memory'
          );
        }, 60000); // Every minute
      }
    }
  }

  /**
   * Store error for analytics
   */
  private async storeErrorForAnalytics(error: string, context: string): Promise<void> {
    try {
      const errorLog = {
        error,
        context,
        timestamp: Date.now(),
        sessionId: this.sessionStartTime.toString(),
        userAgent: navigator.userAgent
      };

      // Store in AsyncStorage for later upload
      const existingErrors = await AsyncStorage.getItem('error_logs');
      const errors = existingErrors ? JSON.parse(existingErrors) : [];
      errors.push(errorLog);

      // Keep only last 100 errors
      if (errors.length > 100) {
        errors.splice(0, 50);
      }

      await AsyncStorage.setItem('error_logs', JSON.stringify(errors));
    } catch (storageError) {
      console.warn('Failed to store error log:', storageError);
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    sessionDuration: number;
    totalMetrics: number;
    recentAlerts: number;
    avgNetworkLatency: number;
    currentCacheHitRate: string;
    errorCount: number;
    systemHealth: 'excellent' | 'good' | 'fair' | 'poor';
  } {
    const sessionDuration = (Date.now() - this.sessionStartTime) / 1000 / 60; // minutes
    const recentAlerts = this.alerts.filter(a => Date.now() - a.timestamp < 300000).length; // Last 5 minutes
    
    // Calculate average network latency
    const networkMetrics = this.metrics.filter(m => m.name === 'network_latency');
    const avgLatency = networkMetrics.length > 0 
      ? networkMetrics.reduce((sum, m) => sum + m.value, 0) / networkMetrics.length 
      : 0;

    // Get latest cache hit rate
    const cacheStats = globalCache.getStats();

    // Determine system health
    let systemHealth: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    if (recentAlerts > 5 || avgLatency > 3000 || this.errorCount > 10) {
      systemHealth = 'poor';
    } else if (recentAlerts > 2 || avgLatency > 2000 || this.errorCount > 5) {
      systemHealth = 'fair';
    } else if (recentAlerts > 0 || avgLatency > 1000 || this.errorCount > 2) {
      systemHealth = 'good';
    }

    return {
      sessionDuration: Math.round(sessionDuration),
      totalMetrics: this.metrics.length,
      recentAlerts,
      avgNetworkLatency: Math.round(avgLatency),
      currentCacheHitRate: cacheStats.hitRate,
      errorCount: this.errorCount,
      systemHealth
    };
  }

  /**
   * Get detailed metrics for analysis
   */
  getDetailedMetrics(): {
    metrics: PerformanceMetric[];
    alerts: Array<{ message: string; timestamp: number; severity: string }>;
    summary: {
      sessionDuration: number;
      totalMetrics: number;
      recentAlerts: number;
      avgNetworkLatency: number;
      currentCacheHitRate: string;
      errorCount: number;
      systemHealth: 'excellent' | 'good' | 'fair' | 'poor';
    };
  } {
    return {
      metrics: [...this.metrics], // Copy to prevent mutations
      alerts: [...this.alerts],
      summary: this.getPerformanceSummary()
    };
  }

  /**
   * Reset monitoring data
   */
  reset(): void {
    this.metrics = [];
    this.alerts = [];
    this.errorCount = 0;
    this.sessionStartTime = Date.now();
    console.log('🔄 Monitoring data reset');
  }
}

// ==================== GLOBAL INSTANCE ====================

export const productionMonitor = new ProductionMonitor();

// Auto-start monitoring in production
if (!__DEV__) {
  productionMonitor.startMonitoring();
}

// ==================== MONITORING HELPERS ====================

/**
 * Monitor function execution time
 */
export function monitorExecution<T>(
  name: string,
  fn: () => Promise<T> | T,
  category: PerformanceMetric['category'] = 'ui'
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      productionMonitor.recordMetric(
        name,
        duration,
        category,
        duration > 2000 ? 'high' : duration > 1000 ? 'medium' : 'low'
      );
      
      resolve(result);
    } catch (error) {
      const duration = Date.now() - startTime;
      productionMonitor.recordMetric(name, duration, category, 'high');
      productionMonitor.recordError(error as Error, name);
      reject(error);
    }
  });
}

/**
 * Monitor component render performance
 */
export function useRenderMonitoring(componentName: string) {
  const renderStart = Date.now();
  
  return () => {
    const renderTime = Date.now() - renderStart;
    productionMonitor.recordMetric(
      `render_${componentName}`,
      renderTime,
      'ui',
      renderTime > 100 ? 'medium' : 'low'
    );
  };
}

console.log('🚀 Production monitoring system loaded - ready for high traffic!'); 