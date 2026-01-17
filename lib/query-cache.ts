/**
 * BLAZINGLY FAST Query Caching
 * Automatic caching layer for database queries with smart invalidation
 */

import { prisma } from './db';
import { getCacheOrFetch, setCache, getCache, deleteCache, CACHE_TTL, CACHE_PREFIX, getCacheKey } from './cache';

/**
 * Cached query wrapper - automatically caches database queries
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  return getCacheOrFetch(key, queryFn, ttl);
}

/**
 * Get user with caching
 */
export async function getCachedUser(userId: string) {
  return cachedQuery(
    getCacheKey(CACHE_PREFIX.USER, userId),
    () => prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        banned: true,
        createdAt: true,
      },
    }),
    CACHE_TTL.LONG
  );
}

/**
 * Get course with caching (includes related data)
 */
export async function getCachedCourse(courseId: string) {
  return cachedQuery(
    getCacheKey(CACHE_PREFIX.COURSE, courseId),
    () => prisma.course.findUnique({
      where: { id: courseId },
      include: {
        courseCategory: true,
        chapter: {
          orderBy: { position: 'asc' },
          include: {
            lessons: {
              orderBy: { position: 'asc' },
            },
          },
        },
        _count: {
          select: {
            enrollment: true,
          },
        },
      },
    }),
    CACHE_TTL.LONG
  );
}

/**
 * Get user enrollments with caching
 */
export async function getCachedUserEnrollments(userId: string) {
  return cachedQuery(
    getCacheKey(CACHE_PREFIX.ENROLLMENT, userId),
    () => prisma.enrollment.findMany({
      where: { userId },
      include: {
        Course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            fileKey: true,
            price: true,
          },
        },
      },
    }),
    CACHE_TTL.MEDIUM
  );
}

/**
 * Get course progress with caching
 */
export async function getCachedProgress(userId: string, courseId: string) {
  return cachedQuery(
    getCacheKey(CACHE_PREFIX.PROGRESS, userId, courseId),
    () => prisma.lessonProgress.findMany({
      where: {
        userId,
        Lesson: {
          Chapter: {
            courseId,
          },
        },
      },
    }),
    CACHE_TTL.SHORT
  );
}

/**
 * Batch get multiple users (prevents N+1 queries)
 */
export async function batchGetUsers(userIds: string[]) {
  // Try to get from cache first
  const cacheKeys = userIds.map(id => getCacheKey(CACHE_PREFIX.USER, id));
  const cached = await Promise.all(cacheKeys.map(key => getCache(key)));
  
  // Find which users are not in cache
  const missingIndices: number[] = [];
  const missingIds: string[] = [];
  
  cached.forEach((user, index) => {
    if (!user) {
      missingIndices.push(index);
      missingIds.push(userIds[index]);
    }
  });

  // Fetch missing users in one query
  if (missingIds.length > 0) {
    const freshUsers = await prisma.user.findMany({
      where: { id: { in: missingIds } },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    // Cache fresh users
    await Promise.all(
      freshUsers.map(user =>
        setCache(getCacheKey(CACHE_PREFIX.USER, user.id), user, CACHE_TTL.LONG)
      )
    );

    // Merge fresh users into result
    const userMap = new Map(freshUsers.map(u => [u.id, u]));
    missingIndices.forEach((index) => {
      cached[index] = userMap.get(userIds[index]) || null;
    });
  }

  return cached;
}

/**
 * Batch get multiple courses
 */
export async function batchGetCourses(courseIds: string[]) {
  const cacheKeys = courseIds.map(id => getCacheKey(CACHE_PREFIX.COURSE, id));
  const cached = await Promise.all(cacheKeys.map(key => getCache(key)));
  
  const missingIndices: number[] = [];
  const missingIds: string[] = [];
  
  cached.forEach((course, index) => {
    if (!course) {
      missingIndices.push(index);
      missingIds.push(courseIds[index]);
    }
  });

  if (missingIds.length > 0) {
    const freshCourses = await prisma.course.findMany({
      where: { id: { in: missingIds } },
      include: {
        courseCategory: true,
        _count: {
          select: {
            enrollment: true,
          },
        },
      },
    });

    await Promise.all(
      freshCourses.map(course =>
        setCache(getCacheKey(CACHE_PREFIX.COURSE, course.id), course, CACHE_TTL.LONG)
      )
    );

    const courseMap = new Map(freshCourses.map(c => [c.id, c]));
    missingIndices.forEach((index) => {
      cached[index] = courseMap.get(courseIds[index]) || null;
    });
  }

  return cached;
}

/**
 * Prefetch related data to prevent N+1 queries
 */
export async function prefetchCourseData(courseId: string) {
  const [course, chapters] = await Promise.all([
    getCachedCourse(courseId),
    prisma.chapter.findMany({
      where: { courseId },
      include: {
        lessons: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { position: 'asc' },
    }),
  ]);

  // Cache chapters and lessons
  await Promise.all([
    ...chapters.map(chapter =>
      setCache(`chapter:${chapter.id}`, chapter, CACHE_TTL.LONG)
    ),
    ...chapters.flatMap(chapter =>
      chapter.lessons.map(lesson =>
        setCache(`lesson:${lesson.id}`, lesson, CACHE_TTL.LONG)
      )
    ),
  ]);

  return { course, chapters };
}

/**
 * Smart invalidation - invalidate related caches
 */
export async function invalidateUserData(userId: string) {
  await Promise.all([
    deleteCache(getCacheKey(CACHE_PREFIX.USER, userId)),
    deleteCache(getCacheKey(CACHE_PREFIX.ENROLLMENT, userId)),
    deleteCache(getCacheKey(CACHE_PREFIX.PROGRESS, userId, '*')),
  ]);
}

export async function invalidateCourseData(courseId: string) {
  await deleteCache(getCacheKey(CACHE_PREFIX.COURSE, courseId));
}

/**
 * Bulk fetch with single query - use this instead of multiple findUnique calls
 */
export async function bulkFetch<T>(
  model: any,
  ids: string[],
  cachePrefix: string,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<(T | null)[]> {
  if (ids.length === 0) return [];

  // Check cache first
  const cacheKeys = ids.map(id => getCacheKey(cachePrefix, id));
  const cached = await Promise.all(cacheKeys.map(key => getCache<T>(key)));
  
  const missingIndices: number[] = [];
  const missingIds: string[] = [];
  
  cached.forEach((item, index) => {
    if (!item) {
      missingIndices.push(index);
      missingIds.push(ids[index]);
    }
  });

  if (missingIds.length > 0) {
    const fresh = await model.findMany({
      where: { id: { in: missingIds } },
    });

    // Cache fresh items
    await Promise.all(
      fresh.map((item: any) =>
        setCache(getCacheKey(cachePrefix, item.id), item, ttl)
      )
    );

    const itemMap = new Map(fresh.map((item: any) => [item.id, item]));
    missingIndices.forEach((index) => {
      const found = itemMap.get(ids[index]);
      cached[index] = (found ?? null) as Awaited<T> | null;
    });
  }

  return cached;
}
