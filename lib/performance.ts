/**
 * BLAZINGLY FAST Performance Monitoring Utilities
 * Track and optimize application performance in real-time
 */

/**
 * Performance metrics interface
 */
export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * In-memory performance tracker (dev only)
 */
class PerformanceTracker {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000;

  track(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow operations
    if (metric.duration > 1000) {
      console.warn(`⚠️  SLOW: ${metric.name} took ${metric.duration}ms`);
    } else if (metric.duration > 100) {
      console.log(`⏱️  ${metric.name} took ${metric.duration}ms`);
    }
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return this.metrics;
  }

  getAverageDuration(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;
    
    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  clear(): void {
    this.metrics = [];
  }
}

const tracker = new PerformanceTracker();

/**
 * Measure function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const start = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    tracker.track({ name, duration, timestamp: Date.now(), metadata });
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    tracker.track({ 
      name: `${name} (ERROR)`, 
      duration, 
      timestamp: Date.now(), 
      metadata: { ...metadata, error: String(error) } 
    });
    throw error;
  }
}

/**
 * Measure sync function execution time
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, any>
): T {
  const start = performance.now();
  
  try {
    const result = fn();
    const duration = performance.now() - start;
    
    tracker.track({ name, duration, timestamp: Date.now(), metadata });
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    tracker.track({ 
      name: `${name} (ERROR)`, 
      duration, 
      timestamp: Date.now(), 
      metadata: { ...metadata, error: String(error) } 
    });
    throw error;
  }
}

/**
 * Performance timer class for manual timing
 */
export class PerfTimer {
  private startTime: number;
  private name: string;
  private metadata?: Record<string, any>;

  constructor(name: string, metadata?: Record<string, any>) {
    this.name = name;
    this.metadata = metadata;
    this.startTime = performance.now();
  }

  end(): number {
    const duration = performance.now() - this.startTime;
    tracker.track({ 
      name: this.name, 
      duration, 
      timestamp: Date.now(), 
      metadata: this.metadata 
    });
    return duration;
  }

  lap(label: string): number {
    const duration = performance.now() - this.startTime;
    console.log(`📊 ${this.name} - ${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }
}

/**
 * Create a performance timer
 */
export function startTimer(name: string, metadata?: Record<string, any>): PerfTimer {
  return new PerfTimer(name, metadata);
}

/**
 * Get performance statistics
 */
export function getPerformanceStats(name?: string): {
  count: number;
  average: number;
  min: number;
  max: number;
  total: number;
} {
  const metrics = name ? tracker.getMetrics(name) : tracker.getMetrics();
  
  if (metrics.length === 0) {
    return { count: 0, average: 0, min: 0, max: 0, total: 0 };
  }

  const durations = metrics.map(m => m.duration);
  const total = durations.reduce((sum, d) => sum + d, 0);

  return {
    count: metrics.length,
    average: total / metrics.length,
    min: Math.min(...durations),
    max: Math.max(...durations),
    total,
  };
}

/**
 * Log performance report
 */
export function logPerformanceReport(): void {
  const allMetrics = tracker.getMetrics();
  const uniqueNames = [...new Set(allMetrics.map(m => m.name))];

  console.log('\n📊 PERFORMANCE REPORT 📊\n');
  
  uniqueNames.forEach(name => {
    const stats = getPerformanceStats(name);
    console.log(`${name}:`);
    console.log(`  Calls: ${stats.count}`);
    console.log(`  Average: ${stats.average.toFixed(2)}ms`);
    console.log(`  Min: ${stats.min.toFixed(2)}ms`);
    console.log(`  Max: ${stats.max.toFixed(2)}ms`);
    console.log(`  Total: ${stats.total.toFixed(2)}ms\n`);
  });
}

/**
 * Clear all performance metrics
 */
export function clearPerformanceMetrics(): void {
  tracker.clear();
}

/**
 * Decorator for measuring method execution time
 */
export function measure(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const start = performance.now();
    
    try {
      const result = await originalMethod.apply(this, args);
      const duration = performance.now() - start;
      
      tracker.track({
        name: `${target.constructor.name}.${propertyKey}`,
        duration,
        timestamp: Date.now(),
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      tracker.track({
        name: `${target.constructor.name}.${propertyKey} (ERROR)`,
        duration,
        timestamp: Date.now(),
      });
      throw error;
    }
  };

  return descriptor;
}

/**
 * Memory usage helper
 */
export function logMemoryUsage(): void {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    console.log('\n💾 MEMORY USAGE 💾');
    console.log(`RSS: ${(usage.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Heap Total: ${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Heap Used: ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`External: ${(usage.external / 1024 / 1024).toFixed(2)} MB\n`);
  }
}

// Export tracker for advanced usage
export { tracker as performanceTracker };
