import Redis from 'ioredis';

// Global Redis client singleton
const globalForRedis = global as unknown as { redis: Redis | undefined };

let redis: Redis | null = null;

/**
 * Get or create Redis client
 * Falls back gracefully if Redis is not available
 */
export function getRedisClient(): Redis | null {
  // Return existing client if available
  if (redis) return redis;
  if (globalForRedis.redis) {
    redis = globalForRedis.redis;
    return redis;
  }

  // Check if Redis URL is configured
  const redisUrl = process.env.REDIS_URL || process.env.REDIS_URI;
  
  if (!redisUrl) {
    console.warn('⚠️ Redis URL not configured. Caching will be disabled.');
    return null;
  }

  try {
    // Create new Redis client
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Only reconnect when the error contains "READONLY"
          return true;
        }
        return false;
      },
    });

    redis.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redis.on('ready', () => {
      console.log('✅ Redis ready to accept commands');
    });

    redis.on('close', () => {
      console.warn('⚠️ Redis connection closed');
    });

    // Store in global for development hot-reload
    if (process.env.NODE_ENV !== 'production') {
      globalForRedis.redis = redis;
    }

    return redis;
  } catch (error) {
    console.error('❌ Failed to initialize Redis client:', error);
    return null;
  }
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    try {
      await redis.quit();
      redis = null;
      if (globalForRedis.redis) {
        globalForRedis.redis = undefined;
      }
      console.log('✅ Redis connection closed gracefully');
    } catch (error) {
      console.error('❌ Error closing Redis connection:', error);
    }
  }
}

/**
 * Check if Redis is available and connected
 */
export async function isRedisAvailable(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.ping();
    return true;
  } catch {
    return false;
  }
}
