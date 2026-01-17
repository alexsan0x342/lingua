import { getRedisClient } from './redis';

/**
 * Cache configuration - BLAZINGLY FAST!
 */
export const CACHE_TTL = {
  INSTANT: 10, // 10 seconds - for real-time data
  SHORT: 60, // 1 minute - for frequently changing data
  MEDIUM: 300, // 5 minutes - for moderately changing data
  LONG: 1800, // 30 minutes - for rarely changing data
  VERY_LONG: 3600, // 1 hour - for static data
  DAY: 86400, // 24 hours - for very static data
  WEEK: 604800, // 7 days - for extremely static data
  MONTH: 2592000, // 30 days - for immutable data
} as const;

/**
 * Cache key prefixes for organization
 */
export const CACHE_PREFIX = {
  USER: 'user',
  SESSION: 'session',
  COURSE: 'course',
  LESSON: 'lesson',
  ENROLLMENT: 'enrollment',
  SITE_SETTINGS: 'site_settings',
  COURSE_LIST: 'course_list',
  CATEGORY: 'category',
  PROGRESS: 'progress',
} as const;

/**
 * Generate a cache key with prefix
 */
export function getCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`;
}

/**
 * Get data from cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const data = await redis.get(key);
    if (!data) return null;

    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`❌ Cache get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set data in cache with TTL
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    const serialized = JSON.stringify(value);
    await redis.setex(key, ttl, serialized);
    return true;
  } catch (error) {
    console.error(`❌ Cache set error for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete a single cache key
 */
export async function deleteCache(key: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`❌ Cache delete error for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete multiple cache keys by pattern
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
  const redis = getRedisClient();
  if (!redis) return 0;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;

    const deleted = await redis.del(...keys);
    return deleted;
  } catch (error) {
    console.error(`❌ Cache pattern delete error for pattern ${pattern}:`, error);
    return 0;
  }
}

/**
 * Invalidate all caches for a specific user
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await Promise.all([
    deleteCachePattern(getCacheKey(CACHE_PREFIX.USER, userId, '*')),
    deleteCachePattern(getCacheKey(CACHE_PREFIX.ENROLLMENT, userId, '*')),
    deleteCachePattern(getCacheKey(CACHE_PREFIX.PROGRESS, userId, '*')),
  ]);
}

/**
 * Invalidate all caches for a specific course
 */
export async function invalidateCourseCache(courseId: string): Promise<void> {
  await Promise.all([
    deleteCachePattern(getCacheKey(CACHE_PREFIX.COURSE, courseId, '*')),
    deleteCachePattern(getCacheKey(CACHE_PREFIX.LESSON, '*', courseId, '*')),
    deleteCache(getCacheKey(CACHE_PREFIX.COURSE_LIST, 'all')),
  ]);
}

/**
 * Get or fetch with cache
 * This is a higher-order function that handles cache logic
 */
export async function getCacheOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  // Try to get from cache first
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch from database
  const data = await fetchFn();

  // Store in cache for next time
  await setCache(key, data, ttl);

  return data;
}

/**
 * Batch get multiple keys
 */
export async function batchGetCache<T>(keys: string[]): Promise<(T | null)[]> {
  const redis = getRedisClient();
  if (!redis || keys.length === 0) return keys.map(() => null);

  try {
    const values = await redis.mget(...keys);
    return values.map(v => v ? JSON.parse(v) as T : null);
  } catch (error) {
    console.error('❌ Batch cache get error:', error);
    return keys.map(() => null);
  }
}

/**
 * Batch set multiple keys
 */
export async function batchSetCache<T>(
  entries: Array<{ key: string; value: T; ttl?: number }>,
): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis || entries.length === 0) return false;

  try {
    const pipeline = redis.pipeline();
    
    for (const entry of entries) {
      const serialized = JSON.stringify(entry.value);
      pipeline.setex(entry.key, entry.ttl || CACHE_TTL.MEDIUM, serialized);
    }

    await pipeline.exec();
    return true;
  } catch (error) {
    console.error('❌ Batch cache set error:', error);
    return false;
  }
}

/**
 * Increment a counter in cache
 */
export async function incrementCache(key: string, by: number = 1): Promise<number | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const value = await redis.incrby(key, by);
    return value;
  } catch (error) {
    console.error(`❌ Cache increment error for key ${key}:`, error);
    return null;
  }
}

/**
 * Check if key exists in cache
 */
export async function cacheExists(key: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    const exists = await redis.exists(key);
    return exists === 1;
  } catch (error) {
    console.error(`❌ Cache exists check error for key ${key}:`, error);
    return false;
  }
}

/**
 * Get remaining TTL for a key
 */
export async function getCacheTTL(key: string): Promise<number | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const ttl = await redis.ttl(key);
    return ttl > 0 ? ttl : null;
  } catch (error) {
    console.error(`❌ Cache TTL check error for key ${key}:`, error);
    return null;
  }
}
