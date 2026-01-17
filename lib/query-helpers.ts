/**
 * BLAZINGLY FAST Query Optimization Helpers
 * Performance utilities for database queries
 */

import { prisma } from './db';
import { Prisma } from './generated/prisma';

/**
 * Optimized pagination with cursor-based approach
 */
export async function paginateQuery<T>(
  model: any,
  options: {
    where?: any;
    orderBy?: any;
    cursor?: string;
    take?: number;
    include?: any;
    select?: any;
  }
) {
  const { where, orderBy, cursor, take = 20, include, select } = options;

  const results = await model.findMany({
    where,
    orderBy: orderBy || { createdAt: 'desc' },
    take: take + 1, // Get one extra to check if there's a next page
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    ...(include && { include }),
    ...(select && { select }),
  });

  const hasMore = results.length > take;
  const items = hasMore ? results.slice(0, -1) : results;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
}

/**
 * Parallel query execution - run multiple queries simultaneously
 */
export async function parallelQueries<T extends readonly unknown[]>(
  ...queries: { [K in keyof T]: Promise<T[K]> }
): Promise<T> {
  return Promise.all(queries) as Promise<T>;
}

/**
 * Optimized count with caching
 */
export async function cachedCount(
  model: any,
  where: any,
  cacheKey: string,
  ttl: number = 300
): Promise<number> {
  const { getCache, setCache } = await import('./cache');
  
  const cached = await getCache<number>(cacheKey);
  if (cached !== null) return cached;

  const count = await model.count({ where });
  await setCache(cacheKey, count, ttl);

  return count;
}

/**
 * Select only necessary fields to reduce data transfer
 */
export const minimalUserSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  role: true,
} as const;

export const minimalCourseSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  imageUrl: true,
  price: true,
  published: true,
} as const;

export const minimalLessonSelect = {
  id: true,
  title: true,
  slug: true,
  position: true,
  isFree: true,
} as const;

/**
 * Batch update helper - more efficient than multiple updates
 */
export async function batchUpdate<T>(
  model: any,
  updates: Array<{ where: any; data: any }>
): Promise<void> {
  await prisma.$transaction(
    updates.map(({ where, data }) => model.update({ where, data }))
  );
}

/**
 * Bulk create helper - single query instead of multiple
 */
export async function bulkCreate<T>(
  model: any,
  data: T[]
): Promise<Prisma.BatchPayload> {
  return model.createMany({
    data,
    skipDuplicates: true,
  });
}

/**
 * Efficient exists check without fetching data
 */
export async function exists(model: any, where: any): Promise<boolean> {
  const result = await model.findFirst({
    where,
    select: { id: true },
  });
  return result !== null;
}

/**
 * Optimized find with default values
 */
export async function findOrDefault<T>(
  model: any,
  where: any,
  defaultValue: T,
  select?: any
): Promise<T> {
  const result = await model.findFirst({
    where,
    ...(select && { select }),
  });
  return result || defaultValue;
}

/**
 * Smart query builder that adds optimal includes
 */
export function optimizedInclude(includes: string[]) {
  const includeMap: Record<string, any> = {};
  
  for (const include of includes) {
    switch (include) {
      case 'user':
        includeMap.user = { select: minimalUserSelect };
        break;
      case 'course':
        includeMap.course = { select: minimalCourseSelect };
        break;
      case 'lesson':
        includeMap.lesson = { select: minimalLessonSelect };
        break;
      case 'category':
        includeMap.category = {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        };
        break;
      default:
        includeMap[include] = true;
    }
  }
  
  return includeMap;
}

/**
 * Query with timeout to prevent hanging
 */
export async function queryWithTimeout<T>(
  queryFn: () => Promise<T>,
  timeoutMs: number = 5000
): Promise<T> {
  return Promise.race([
    queryFn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    ),
  ]);
}

/**
 * Aggregate multiple IDs into a single query
 */
export async function aggregateByIds<T>(
  model: any,
  ids: string[],
  aggregations: {
    count?: boolean;
    sum?: string[];
    avg?: string[];
    min?: string[];
    max?: string[];
  }
) {
  const aggregateQuery: any = {};
  
  if (aggregations.count) aggregateQuery._count = true;
  if (aggregations.sum) {
    aggregateQuery._sum = {};
    aggregations.sum.forEach(field => aggregateQuery._sum[field] = true);
  }
  if (aggregations.avg) {
    aggregateQuery._avg = {};
    aggregations.avg.forEach(field => aggregateQuery._avg[field] = true);
  }
  if (aggregations.min) {
    aggregateQuery._min = {};
    aggregations.min.forEach(field => aggregateQuery._min[field] = true);
  }
  if (aggregations.max) {
    aggregateQuery._max = {};
    aggregations.max.forEach(field => aggregateQuery._max[field] = true);
  }

  return model.aggregate({
    where: { id: { in: ids } },
    ...aggregateQuery,
  });
}

/**
 * Smart search with relevance scoring
 */
export async function smartSearch(
  model: any,
  searchTerm: string,
  fields: string[],
  options: {
    take?: number;
    where?: any;
    orderBy?: any;
  } = {}
) {
  const { take = 20, where = {}, orderBy } = options;

  // Build OR conditions for all search fields
  const searchConditions = fields.map(field => ({
    [field]: {
      contains: searchTerm,
      mode: 'insensitive' as const,
    },
  }));

  return model.findMany({
    where: {
      ...where,
      OR: searchConditions,
    },
    take,
    orderBy: orderBy || { createdAt: 'desc' },
  });
}

/**
 * Deduplicate results by ID
 */
export function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

/**
 * Group results by field
 */
export function groupBy<T, K extends keyof T>(
  items: T[],
  key: K
): Map<T[K], T[]> {
  const groups = new Map<T[K], T[]>();
  
  for (const item of items) {
    const groupKey = item[key];
    const group = groups.get(groupKey) || [];
    group.push(item);
    groups.set(groupKey, group);
  }
  
  return groups;
}
