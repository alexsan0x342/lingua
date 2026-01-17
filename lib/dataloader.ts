/**
 * BLAZINGLY FAST DataLoader Implementation
 * Prevents N+1 queries by batching and caching database requests
 */

import { prisma } from './db';

/**
 * Simple DataLoader implementation for batching queries
 */
class DataLoader<K, V> {
  private batchLoadFn: (keys: readonly K[]) => Promise<(V | Error)[]>;
  private cache: Map<K, Promise<V>>;
  private batch: Map<K, Array<(value: V | Error) => void>>;
  private batchScheduled: boolean;

  constructor(batchLoadFn: (keys: readonly K[]) => Promise<(V | Error)[]>) {
    this.batchLoadFn = batchLoadFn;
    this.cache = new Map();
    this.batch = new Map();
    this.batchScheduled = false;
  }

  load(key: K): Promise<V> {
    // Return cached value if available
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    // Create promise and add to batch
    const promise = new Promise<V>((resolve, reject) => {
      const callbacks = this.batch.get(key) || [];
      callbacks.push((result: V | Error) => {
        if (result instanceof Error) {
          reject(result);
        } else {
          resolve(result);
        }
      });
      this.batch.set(key, callbacks);
    });

    this.cache.set(key, promise);

    // Schedule batch execution
    if (!this.batchScheduled) {
      this.batchScheduled = true;
      process.nextTick(() => this.executeBatch());
    }

    return promise;
  }

  async loadMany(keys: K[]): Promise<(V | Error)[]> {
    return Promise.all(keys.map(key => this.load(key).catch(err => err)));
  }

  clear(key: K): void {
    this.cache.delete(key);
  }

  clearAll(): void {
    this.cache.clear();
  }

  private async executeBatch() {
    this.batchScheduled = false;
    
    const keys = Array.from(this.batch.keys());
    if (keys.length === 0) return;

    const batch = new Map(this.batch);
    this.batch.clear();

    try {
      const results = await this.batchLoadFn(keys);
      
      keys.forEach((key, index) => {
        const callbacks = batch.get(key) || [];
        const result = results[index];
        callbacks.forEach(callback => callback(result));
      });
    } catch (error) {
      keys.forEach(key => {
        const callbacks = batch.get(key) || [];
        callbacks.forEach(callback => callback(error as Error));
      });
    }
  }
}

/**
 * User DataLoader - batches user lookups
 */
export function createUserLoader() {
  return new DataLoader<string, any>(async (userIds) => {
    const users = await prisma.user.findMany({
      where: { id: { in: [...userIds] } },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        emailVerified: true,
        banned: true,
      },
    });

    const userMap = new Map(users.map(user => [user.id, user]));
    return userIds.map(id => userMap.get(id) || new Error(`User ${id} not found`));
  });
}

/**
 * Course DataLoader - batches course lookups
 */
export function createCourseLoader() {
  return new DataLoader<string, any>(async (courseIds) => {
    const courses = await prisma.course.findMany({
      where: { id: { in: [...courseIds] } },
      include: {
        courseCategory: true,
        _count: {
          select: {
            enrollment: true,
          },
        },
      },
    });

    const courseMap = new Map(courses.map(course => [course.id, course]));
    return courseIds.map(id => courseMap.get(id) || new Error(`Course ${id} not found`));
  });
}

/**
 * Lesson DataLoader - batches lesson lookups
 */
export function createLessonLoader() {
  return new DataLoader<string, any>(async (lessonIds) => {
    const lessons = await prisma.lesson.findMany({
      where: { id: { in: [...lessonIds] } },
      include: {
        Chapter: {
          include: {
            Course: true,
          },
        },
      },
    });

    const lessonMap = new Map(lessons.map(lesson => [lesson.id, lesson]));
    return lessonIds.map(id => lessonMap.get(id) || new Error(`Lesson ${id} not found`));
  });
}

/**
 * Enrollment DataLoader - batches enrollment checks
 */
export function createEnrollmentLoader() {
  return new DataLoader<string, any>(async (keys) => {
    // Keys are in format "userId:courseId"
    const parsed = keys.map(key => {
      const [userId, courseId] = (key as string).split(':');
      return { userId, courseId };
    });

    const enrollments = await prisma.enrollment.findMany({
      where: {
        OR: parsed.map(({ userId, courseId }) => ({
          userId,
          courseId,
        })),
      },
    });

    const enrollmentMap = new Map(
      enrollments.map(e => [`${e.userId}:${e.courseId}`, e])
    );

    return keys.map(key => 
      enrollmentMap.get(key as string) || new Error(`Enrollment ${key} not found`)
    );
  });
}

/**
 * Progress DataLoader - batches progress lookups
 */
export function createProgressLoader() {
  return new DataLoader<string, any>(async (keys) => {
    // Keys are in format "userId:lessonId"
    const parsed = keys.map(key => {
      const [userId, lessonId] = (key as string).split(':');
      return { userId, lessonId };
    });

    const progress = await prisma.lessonProgress.findMany({
      where: {
        OR: parsed.map(({ userId, lessonId }) => ({
          userId,
          lessonId,
        })),
      },
    });

    const progressMap = new Map(
      progress.map(p => [`${p.userId}:${p.lessonId}`, p])
    );

    return keys.map(key => 
      progressMap.get(key as string) || null
    );
  });
}

/**
 * Create all loaders for a request context
 */
export function createLoaders() {
  return {
    users: createUserLoader(),
    courses: createCourseLoader(),
    lessons: createLessonLoader(),
    enrollments: createEnrollmentLoader(),
    progress: createProgressLoader(),
  };
}

/**
 * Request-scoped loader context
 */
type LoaderContext = ReturnType<typeof createLoaders>;

const { AsyncLocalStorage } = require('async_hooks');
const loaderStorage = new AsyncLocalStorage();

/**
 * Run function with loaders in context
 */
export async function withLoaders<T>(fn: () => Promise<T>): Promise<T> {
  const loaders = createLoaders();
  return loaderStorage.run(loaders, fn);
}

/**
 * Get current loaders from context (or create new ones)
 */
export function getLoaders(): LoaderContext {
  return loaderStorage.getStore() || createLoaders();
}
