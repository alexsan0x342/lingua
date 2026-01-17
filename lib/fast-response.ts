/**
 * BLAZINGLY FAST API Response Utilities
 * Utilities for optimizing API responses with compression, caching, and streaming
 */

import { NextResponse } from 'next/server';

/**
 * Cache headers for different data freshness requirements
 */
export const RESPONSE_CACHE = {
  NO_CACHE: 'no-store, max-age=0, must-revalidate',
  SHORT: 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
  MEDIUM: 'public, max-age=300, s-maxage=300, stale-while-revalidate=60',
  LONG: 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=300',
  VERY_LONG: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
  STATIC: 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
  IMMUTABLE: 'public, max-age=31536000, immutable',
} as const;

/**
 * Create a cached JSON response
 */
export function cachedJson<T>(
  data: T,
  options: {
    status?: number;
    cache?: string;
    headers?: Record<string, string>;
  } = {}
): NextResponse {
  const {
    status = 200,
    cache = RESPONSE_CACHE.MEDIUM,
    headers = {},
  } = options;

  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': cache,
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });
}

/**
 * Create an error response with proper caching
 */
export function errorResponse(
  message: string,
  status: number = 500,
  cache: boolean = false
): NextResponse {
  return NextResponse.json(
    { error: message, success: false },
    {
      status,
      headers: {
        'Cache-Control': cache ? RESPONSE_CACHE.SHORT : RESPONSE_CACHE.NO_CACHE,
        'Content-Type': 'application/json; charset=utf-8',
      },
    }
  );
}

/**
 * Create a success response with proper caching
 */
export function successResponse<T>(
  data: T,
  cache: string = RESPONSE_CACHE.MEDIUM
): NextResponse {
  return cachedJson({ success: true, data }, { cache });
}

/**
 * Performance timing header
 */
export function addTimingHeader(
  response: NextResponse,
  startTime: number
): NextResponse {
  const duration = Date.now() - startTime;
  response.headers.set('Server-Timing', `total;dur=${duration}`);
  return response;
}

/**
 * ETag generation for conditional requests
 */
export function generateETag(data: unknown): string {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `"${Math.abs(hash).toString(36)}"`;
}

/**
 * Handle conditional requests with ETags
 */
export function conditionalResponse<T>(
  data: T,
  request: Request,
  options: {
    cache?: string;
    maxAge?: number;
  } = {}
): NextResponse {
  const etag = generateETag(data);
  const ifNoneMatch = request.headers.get('if-none-match');

  // If ETags match, return 304 Not Modified
  if (ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        'ETag': etag,
        'Cache-Control': options.cache || RESPONSE_CACHE.MEDIUM,
      },
    });
  }

  // Return full response with ETag
  return NextResponse.json(data, {
    headers: {
      'ETag': etag,
      'Cache-Control': options.cache || RESPONSE_CACHE.MEDIUM,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

/**
 * Optimize response by removing null/undefined values
 */
export function compactObject<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      result[key] = typeof value === 'object' && !Array.isArray(value) 
        ? compactObject(value)
        : value;
    }
  }
  return result;
}

/**
 * Streaming JSON response for large datasets
 */
export async function* streamJsonArray<T>(
  items: AsyncIterable<T> | Iterable<T>
): AsyncGenerator<string> {
  yield '[';
  let first = true;
  
  for await (const item of items) {
    if (!first) yield ',';
    yield JSON.stringify(item);
    first = false;
  }
  
  yield ']';
}

/**
 * Create a streaming response
 */
export function streamResponse(
  generator: AsyncGenerator<string>,
  cache: string = RESPONSE_CACHE.NO_CACHE
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generator) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cache,
      'Transfer-Encoding': 'chunked',
    },
  });
}
