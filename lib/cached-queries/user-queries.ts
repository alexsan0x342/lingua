import { prisma } from '../db';
import { 
  getCacheOrFetch, 
  getCacheKey, 
  CACHE_PREFIX, 
  CACHE_TTL,
  deleteCache,
  invalidateUserCache,
} from '../cache';

/**
 * Get user by ID with caching
 */
export async function getCachedUser(userId: string) {
  const cacheKey = getCacheKey(CACHE_PREFIX.USER, userId);
  
  return getCacheOrFetch(
    cacheKey,
    async () => {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          role: true,
          banned: true,
          banReason: true,
          deviceLockUntil: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    },
    CACHE_TTL.MEDIUM
  );
}

/**
 * Get user by email with caching
 */
export async function getCachedUserByEmail(email: string) {
  const cacheKey = getCacheKey(CACHE_PREFIX.USER, 'email', email.toLowerCase());
  
  return getCacheOrFetch(
    cacheKey,
    async () => {
      return await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          role: true,
          banned: true,
          password: true,
          createdAt: true,
        },
      });
    },
    CACHE_TTL.MEDIUM
  );
}

/**
 * Get user session with caching
 */
export async function getCachedSession(token: string) {
  const cacheKey = getCacheKey(CACHE_PREFIX.SESSION, token);
  
  return getCacheOrFetch(
    cacheKey,
    async () => {
      return await prisma.session.findUnique({
        where: { token },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              banned: true,
              image: true,
            },
          },
        },
      });
    },
    CACHE_TTL.SHORT // Sessions should have shorter TTL
  );
}

/**
 * Get user enrollments with caching
 */
export async function getCachedUserEnrollments(userId: string) {
  const cacheKey = getCacheKey(CACHE_PREFIX.ENROLLMENT, userId, 'list');
  
  return getCacheOrFetch(
    cacheKey,
    async () => {
      return await prisma.enrollment.findMany({
        where: {
          userId,
          status: 'Active',
        },
        include: {
          Course: {
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              fileKey: true,
              price: true,
              level: true,
              duration: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    },
    CACHE_TTL.MEDIUM
  );
}

/**
 * Check if user is enrolled in a course with caching
 */
export async function getCachedEnrollmentStatus(userId: string, courseId: string) {
  const cacheKey = getCacheKey(CACHE_PREFIX.ENROLLMENT, userId, courseId);
  
  return getCacheOrFetch(
    cacheKey,
    async () => {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      });
      
      return enrollment?.status === 'Active' ? enrollment : null;
    },
    CACHE_TTL.MEDIUM
  );
}

/**
 * Get user's active sessions with caching
 */
export async function getCachedUserSessions(userId: string) {
  const cacheKey = getCacheKey(CACHE_PREFIX.SESSION, 'user', userId);
  
  return getCacheOrFetch(
    cacheKey,
    async () => {
      return await prisma.session.findMany({
        where: {
          userId,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    },
    CACHE_TTL.SHORT
  );
}

/**
 * Invalidate user-related caches
 * Call this when user data changes
 */
export async function invalidateUserCaches(userId: string, email?: string) {
  await Promise.all([
    deleteCache(getCacheKey(CACHE_PREFIX.USER, userId)),
    email ? deleteCache(getCacheKey(CACHE_PREFIX.USER, 'email', email.toLowerCase())) : Promise.resolve(),
    invalidateUserCache(userId),
  ]);
}

/**
 * Invalidate session cache
 * Call this when session changes or is deleted
 */
export async function invalidateSessionCache(token: string, userId?: string) {
  await Promise.all([
    deleteCache(getCacheKey(CACHE_PREFIX.SESSION, token)),
    userId ? deleteCache(getCacheKey(CACHE_PREFIX.SESSION, 'user', userId)) : Promise.resolve(),
  ]);
}

/**
 * Invalidate enrollment caches
 * Call this when enrollment is created/updated/deleted
 */
export async function invalidateEnrollmentCache(userId: string, courseId?: string) {
  await Promise.all([
    deleteCache(getCacheKey(CACHE_PREFIX.ENROLLMENT, userId, 'list')),
    courseId ? deleteCache(getCacheKey(CACHE_PREFIX.ENROLLMENT, userId, courseId)) : Promise.resolve(),
  ]);
}
