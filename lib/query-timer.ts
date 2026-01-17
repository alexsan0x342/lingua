import { PrismaClient } from "./generated/prisma";

/**
 * Query Timer Middleware for Prisma
 * Logs the execution time of all database queries
 */
export function enableQueryTiming(prisma: PrismaClient) {
  if (process.env.NODE_ENV === "production") {
    // Optionally disable in production or adjust logging
    return;
  }

  prisma.$use(async (params, next) => {
    const start = Date.now();
    const result = await next(params);
    const duration = Date.now() - start;

    // Color-code based on duration
    let color = "\x1b[32m"; // Green for fast queries (< 50ms)
    if (duration > 100) {
      color = "\x1b[31m"; // Red for slow queries (> 100ms)
    } else if (duration > 50) {
      color = "\x1b[33m"; // Yellow for medium queries (50-100ms)
    }

    console.log(
      `${color}⚡ Query: ${params.model}.${params.action} - ${duration}ms\x1b[0m`
    );

    return result;
  });
}

/**
 * Performance tracker for custom queries
 * Use this to wrap any database operation for timing
 */
export async function timedQuery<T>(
  name: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await queryFn();
    const duration = Date.now() - start;
    
    let color = "\x1b[32m";
    if (duration > 100) {
      color = "\x1b[31m";
    } else if (duration > 50) {
      color = "\x1b[33m";
    }
    
    console.log(`${color}⚡ ${name} - ${duration}ms\x1b[0m`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`\x1b[31m❌ ${name} - Failed after ${duration}ms\x1b[0m`);
    throw error;
  }
}
