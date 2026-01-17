import { prisma } from '../db';
import {
  getCacheOrFetch,
  getCacheKey,
  CACHE_PREFIX,
  CACHE_TTL,
  deleteCache,
  invalidateCourseCache,
  deleteCachePattern,
} from '../cache';

/**
 * Get course by ID with caching
 */
export async function getCachedCourse(courseId: string) {
  const cacheKey = getCacheKey(CACHE_PREFIX.COURSE, courseId);

  return getCacheOrFetch(
    cacheKey,
    async () => {
      return await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          title: true,
          description: true,
          fileKey: true,
          price: true,
          duration: true,
          level: true,
          category: true,
          categoryId: true,
          smallDescription: true,
          slug: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          courseCategory: {
            select: {
              name: true,
              nameAr: true,
            },
          },
        },
      });
    },
    CACHE_TTL.LONG
  );
}

/**
 * Get course by slug with caching
 */
export async function getCachedCourseBySlug(slug: string) {
  const cacheKey = getCacheKey(CACHE_PREFIX.COURSE, 'slug', slug);

  return getCacheOrFetch(
    cacheKey,
    async () => {
      return await prisma.course.findUnique({
        where: { slug },
        select: {
          id: true,
          title: true,
          description: true,
          fileKey: true,
          price: true,
          duration: true,
          level: true,
          category: true,
          slug: true,
          smallDescription: true,
          courseCategory: {
            select: {
              name: true,
              nameAr: true,
            },
          },
          chapter: {
            select: {
              id: true,
              title: true,
              position: true,
              lessons: {
                select: {
                  id: true,
                  title: true,
                  isFree: true,
                  position: true,
                },
                orderBy: {
                  position: 'asc',
                },
              },
            },
            orderBy: {
              position: 'asc',
            },
          },
        },
      });
    },
    CACHE_TTL.LONG
  );
}

/**
 * Get all published courses with caching
 */
export async function getCachedPublishedCourses() {
  const cacheKey = getCacheKey(CACHE_PREFIX.COURSE_LIST, 'published');

  return getCacheOrFetch(
    cacheKey,
    async () => {
      return await prisma.course.findMany({
        where: {
          status: 'Published',
        },
        select: {
          id: true,
          title: true,
          description: true,
          smallDescription: true,
          fileKey: true,
          price: true,
          duration: true,
          level: true,
          category: true,
          slug: true,
          createdAt: true,
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
 * Get course with full details (chapters and lessons) with caching
 */
export async function getCachedCourseWithChapters(courseId: string) {
  const cacheKey = getCacheKey(CACHE_PREFIX.COURSE, courseId, 'full');

  return getCacheOrFetch(
    cacheKey,
    async () => {
      return await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          chapter: {
            include: {
              lessons: {
                orderBy: {
                  position: 'asc',
                },
              },
            },
            orderBy: {
              position: 'asc',
            },
          },
          courseCategory: true,
        },
      });
    },
    CACHE_TTL.LONG
  );
}

/**
 * Get lesson by ID with caching
 */
export async function getCachedLesson(lessonId: string) {
  const cacheKey = getCacheKey(CACHE_PREFIX.LESSON, lessonId);

  return getCacheOrFetch(
    cacheKey,
    async () => {
      return await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          Chapter: {
            select: {
              id: true,
              title: true,
              courseId: true,
              Course: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                },
              },
            },
          },
        },
      });
    },
    CACHE_TTL.LONG
  );
}

/**
 * Get course categories with caching
 */
export async function getCachedCourseCategories() {
  const cacheKey = getCacheKey(CACHE_PREFIX.CATEGORY, 'all');

  return getCacheOrFetch(
    cacheKey,
    async () => {
      return await prisma.courseCategory.findMany({
        orderBy: {
          name: 'asc',
        },
      });
    },
    CACHE_TTL.VERY_LONG
  );
}

/**
 * Get courses by category with caching
 */
export async function getCachedCoursesByCategory(categoryId: string) {
  const cacheKey = getCacheKey(CACHE_PREFIX.COURSE_LIST, 'category', categoryId);

  return getCacheOrFetch(
    cacheKey,
    async () => {
      return await prisma.course.findMany({
        where: {
          categoryId,
          status: 'Published',
        },
        select: {
          id: true,
          title: true,
          description: true,
          smallDescription: true,
          fileKey: true,
          price: true,
          duration: true,
          level: true,
          slug: true,
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
 * Get user's lesson progress with caching
 */
export async function getCachedLessonProgress(userId: string, lessonId: string) {
  const cacheKey = getCacheKey(CACHE_PREFIX.PROGRESS, userId, lessonId);

  return getCacheOrFetch(
    cacheKey,
    async () => {
      return await prisma.lessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId,
            lessonId,
          },
        },
      });
    },
    CACHE_TTL.SHORT
  );
}

/**
 * Get all lesson progress for a user in a course with caching
 */
export async function getCachedCourseProgress(userId: string, courseId: string) {
  const cacheKey = getCacheKey(CACHE_PREFIX.PROGRESS, userId, 'course', courseId);

  return getCacheOrFetch(
    cacheKey,
    async () => {
      return await prisma.lessonProgress.findMany({
        where: {
          userId,
          Lesson: {
            Chapter: {
              courseId,
            },
          },
        },
        include: {
          Lesson: {
            select: {
              id: true,
              title: true,
              chapterId: true,
            },
          },
        },
      });
    },
    CACHE_TTL.SHORT
  );
}

/**
 * Invalidate course-related caches
 * Call this when course data changes
 */
export async function invalidateCourseCaches(courseId: string, slug?: string) {
  await Promise.all([
    deleteCache(getCacheKey(CACHE_PREFIX.COURSE, courseId)),
    deleteCache(getCacheKey(CACHE_PREFIX.COURSE, courseId, 'full')),
    slug ? deleteCache(getCacheKey(CACHE_PREFIX.COURSE, 'slug', slug)) : Promise.resolve(),
    deleteCachePattern(getCacheKey(CACHE_PREFIX.COURSE_LIST, '*')),
    invalidateCourseCache(courseId),
  ]);
}

/**
 * Invalidate lesson cache
 * Call this when lesson data changes
 */
export async function invalidateLessonCache(lessonId: string, courseId?: string) {
  await Promise.all([
    deleteCache(getCacheKey(CACHE_PREFIX.LESSON, lessonId)),
    courseId ? invalidateCourseCache(courseId) : Promise.resolve(),
  ]);
}

/**
 * Invalidate progress cache
 * Call this when lesson progress changes
 */
export async function invalidateProgressCache(userId: string, lessonId?: string, courseId?: string) {
  await Promise.all([
    lessonId ? deleteCache(getCacheKey(CACHE_PREFIX.PROGRESS, userId, lessonId)) : Promise.resolve(),
    courseId ? deleteCache(getCacheKey(CACHE_PREFIX.PROGRESS, userId, 'course', courseId)) : Promise.resolve(),
    deleteCachePattern(getCacheKey(CACHE_PREFIX.PROGRESS, userId, '*')),
  ]);
}

/**
 * Invalidate category cache
 * Call this when categories change
 */
export async function invalidateCategoryCache() {
  await deleteCache(getCacheKey(CACHE_PREFIX.CATEGORY, 'all'));
}
