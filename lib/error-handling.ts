// Production Error Handling and Logging System
import { NextRequest, NextResponse } from 'next/server';

export interface ErrorContext {
  userId?: string;
  userAgent?: string;
  ip?: string;
  timestamp: Date;
  requestId: string;
  path: string;
  method: string;
}

export class ProductionLogger {
  private static instance: ProductionLogger;
  
  static getInstance(): ProductionLogger {
    if (!ProductionLogger.instance) {
      ProductionLogger.instance = new ProductionLogger();
    }
    return ProductionLogger.instance;
  }

  // Log levels
  error(message: string, error?: Error, context?: Partial<ErrorContext>) {
    const logData = this.formatLog('ERROR', message, error, context);
    console.error(JSON.stringify(logData));
    
    // In production, send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(logData);
    }
  }

  warn(message: string, context?: Partial<ErrorContext>) {
    const logData = this.formatLog('WARN', message, undefined, context);
    console.warn(JSON.stringify(logData));
    
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(logData);
    }
  }

  info(message: string, context?: Partial<ErrorContext>) {
    const logData = this.formatLog('INFO', message, undefined, context);
    console.info(JSON.stringify(logData));
  }

  // Security events (always logged in production)
  security(message: string, context?: Partial<ErrorContext>) {
    const logData = this.formatLog('SECURITY', message, undefined, context);
    console.error(JSON.stringify(logData));
    
    // Always send security events to external logging
    this.sendToExternalLogger(logData);
  }

  private formatLog(level: string, message: string, error?: Error, context?: Partial<ErrorContext>) {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      error: error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      } : undefined,
      context: {
        requestId: context?.requestId || this.generateRequestId(),
        userId: context?.userId,
        userAgent: context?.userAgent,
        ip: context?.ip,
        path: context?.path,
        method: context?.method,
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version,
      },
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendToExternalLogger(logData: any) {
    try {
      // Replace with your preferred logging service
      // Examples: DataDog, New Relic, Sentry, LogRocket, etc.
      
      if (process.env.SENTRY_DSN) {
        // Send to Sentry
        // await this.sendToSentry(logData);
      }
      
      if (process.env.DATADOG_API_KEY) {
        // Send to DataDog
        // await this.sendToDataDog(logData);
      }
      
      // Fallback: Send to your own logging endpoint
      if (process.env.LOGGING_WEBHOOK_URL) {
        await fetch(process.env.LOGGING_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logData),
        });
      }
    } catch (error) {
      // Don't throw errors in logging - use console as fallback
      console.error('Failed to send log to external service:', error);
    }
  }
}

// Global error handler for API routes
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const logger = ProductionLogger.getInstance();
    
    try {
      return await handler(...args);
    } catch (error) {
      const request = args[0] as NextRequest;
      const context: Partial<ErrorContext> = {
        path: request.nextUrl.pathname,
        method: request.method,
        userAgent: request.headers.get('user-agent') || undefined,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      };

      logger.error('API Route Error', error as Error, context);
      
      // Return structured error response
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { 
            error: 'Internal Server Error',
            requestId: context.requestId 
          },
          { status: 500 }
        ) as R;
      } else {
        return NextResponse.json(
          { 
            error: (error as Error).message,
            stack: (error as Error).stack,
            requestId: context.requestId 
          },
          { status: 500 }
        ) as R;
      }
    }
  };
}

// Database error handler
export function handleDatabaseError(error: any, operation: string) {
  const logger = ProductionLogger.getInstance();
  
  if (error.code === 'P2002') {
    logger.warn(`Database constraint violation in ${operation}`, { path: operation });
    throw new Error('A record with this information already exists');
  }
  
  if (error.code === 'P2025') {
    logger.warn(`Record not found in ${operation}`, { path: operation });
    throw new Error('Record not found');
  }
  
  if (error.code === 'P2003') {
    logger.warn(`Foreign key constraint failed in ${operation}`, { path: operation });
    throw new Error('Related record not found');
  }
  
  // Log unknown database errors
  logger.error(`Database error in ${operation}`, error, { path: operation });
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database operation failed');
  } else {
    throw error;
  }
}

// Rate limiting error
export function handleRateLimitError(identifier: string) {
  const logger = ProductionLogger.getInstance();
  logger.security(`Rate limit exceeded for ${identifier}`, {
    userId: identifier,
  });
  
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429 }
  );
}

// Authentication error
export function handleAuthError(message: string, context?: Partial<ErrorContext>) {
  const logger = ProductionLogger.getInstance();
  logger.security(`Authentication error: ${message}`, context);
  
  return NextResponse.json(
    { error: 'Authentication required' },
    { status: 401 }
  );
}

export const logger = ProductionLogger.getInstance();