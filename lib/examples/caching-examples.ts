/**
 * Example: How to integrate Redis caching into existing API routes
 * 
 * This file demonstrates best practices for adding caching to your endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCachedUser, invalidateUserCaches } from '@/lib/cached-queries/user-queries';
import { 
  getCachedCourse, 
  getCachedPublishedCourses,
  invalidateCourseCaches 
} from '@/lib/cached-queries/course-queries';
import { prisma } from '@/lib/db';

/**
 * Example 1: GET endpoint with caching
 * 
 * ❌ BEFORE (no cache):
 * const user = await prisma.user.findUnique({ where: { id } });
 * 
 * ✅ AFTER (with cache):
 * const user = await getCachedUser(id);
 */
export async function GET_USER_EXAMPLE(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // This will check Redis first, then database if cache miss
    const user = await getCachedUser(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Example 2: POST/PUT endpoint with cache invalidation
 * 
 * IMPORTANT: Always invalidate cache after data changes!
 */
export async function UPDATE_USER_EXAMPLE(request: NextRequest) {
  try {
    const { userId, name, email } = await request.json();

    // Update database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, email },
    });

    // ⚠️ CRITICAL: Invalidate cache after update
    await invalidateUserCaches(userId, email);

    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

/**
 * Example 3: Listing endpoint with caching
 * Perfect for course listings, categories, etc.
 */
export async function GET_COURSES_EXAMPLE() {
  try {
    // This caches the entire published course list
    const courses = await getCachedPublishedCourses();

    return NextResponse.json({ 
      courses,
      count: courses.length 
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

/**
 * Example 4: Parallel fetching with caching
 * Fetch multiple resources simultaneously
 */
export async function GET_DASHBOARD_DATA_EXAMPLE(userId: string) {
  try {
    // All queries run in parallel, each checking cache first
    const [user, courses, enrollments] = await Promise.all([
      getCachedUser(userId),
      getCachedPublishedCourses(),
      prisma.enrollment.findMany({
        where: { userId, status: 'Active' },
      }),
    ]);

    return NextResponse.json({
      user,
      courses,
      enrollments,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}

/**
 * Example 5: Complex query with custom caching
 * For queries not covered by pre-built helpers
 */
import { getCacheOrFetch, getCacheKey, CACHE_PREFIX, CACHE_TTL } from '@/lib/cache';

export async function GET_CUSTOM_DATA_EXAMPLE(courseId: string) {
  const cacheKey = getCacheKey(CACHE_PREFIX.COURSE, courseId, 'stats');

  const stats = await getCacheOrFetch(
    cacheKey,
    async () => {
      // This expensive query only runs on cache miss
      const [enrollmentCount, lessonCount] = await Promise.all([
        prisma.enrollment.count({ where: { courseId } }),
        prisma.lesson.count({
          where: { Chapter: { courseId } },
        }),
      ]);

      return {
        enrollmentCount,
        lessonCount,
      };
    },
    CACHE_TTL.MEDIUM // Cache for 5 minutes
  );

  return NextResponse.json({ stats });
}

/**
 * Example 6: Create endpoint with cache invalidation
 */
export async function CREATE_COURSE_EXAMPLE(request: NextRequest) {
  try {
    const data = await request.json();

    const course = await prisma.course.create({
      data: {
        ...data,
        status: 'Draft',
      },
    });

    // Invalidate course list caches
    await invalidateCourseCaches(course.id, course.slug);

    return NextResponse.json({ 
      success: true, 
      course 
    });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}

/**
 * Example 7: Delete endpoint with cache invalidation
 */
export async function DELETE_COURSE_EXAMPLE(courseId: string) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    await prisma.course.delete({
      where: { id: courseId },
    });

    // Clean up all related caches
    await invalidateCourseCaches(courseId, course.slug);

    return NextResponse.json({ 
      success: true, 
      message: 'Course deleted' 
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}

/**
 * Migration Guide:
 * 
 * 1. IDENTIFY: Find database queries that run frequently
 *    - Look for prisma.*.findUnique, findMany, findFirst
 *    - Profile slow endpoints with high traffic
 * 
 * 2. CACHE: Replace with cached versions
 *    - Use pre-built helpers from /lib/cached-queries/
 *    - Or create custom with getCacheOrFetch()
 * 
 * 3. INVALIDATE: Add cache invalidation on mutations
 *    - After create/update/delete operations
 *    - Use invalidate* functions
 * 
 * 4. TEST: Verify caching works
 *    - Check redis-cli KEYS * to see cached data
 *    - Monitor response times
 *    - Test cache invalidation
 * 
 * 5. MONITOR: Track performance
 *    - Database query count should drop significantly
 *    - Response times should improve
 *    - Redis memory usage should be stable
 */

/**
 * Common Patterns:
 * 
 * ✅ DO:
 * - Cache GET endpoints (read operations)
 * - Invalidate on POST/PUT/DELETE (write operations)
 * - Use appropriate TTL for data volatility
 * - Handle cache failures gracefully
 * 
 * ❌ DON'T:
 * - Cache user-sensitive data without encryption
 * - Use very long TTL for frequently changing data
 * - Forget to invalidate on updates
 * - Cache real-time critical data
 */

export default {
  GET_USER_EXAMPLE,
  UPDATE_USER_EXAMPLE,
  GET_COURSES_EXAMPLE,
  GET_DASHBOARD_DATA_EXAMPLE,
  GET_CUSTOM_DATA_EXAMPLE,
  CREATE_COURSE_EXAMPLE,
  DELETE_COURSE_EXAMPLE,
};
