import "server-only";

// Production-ready logging utility
interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' 
  ? LOG_LEVELS.INFO 
  : LOG_LEVELS.DEBUG;

interface LogEntry {
  timestamp: string;
  level: keyof LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private formatLog(level: keyof LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context) {
      logEntry.context = context;
    }

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }

    return logEntry;
  }

  private shouldLog(level: keyof LogLevel): boolean {
    return LOG_LEVELS[level] <= CURRENT_LOG_LEVEL;
  }

  private writeLog(logEntry: LogEntry): void {
    if (!this.shouldLog(logEntry.level)) {
      return;
    }

    const logString = JSON.stringify(logEntry);
    
    // In production, you might want to send logs to a service like:
    // - Winston with transports to files/remote services
    // - Pino for high-performance logging
    // - CloudWatch, DataDog, or other monitoring services
    
    if (process.env.NODE_ENV === 'production') {
      // Production logging - structured JSON
      console.log(logString);
    } else {
      // Development logging - human readable
      const { timestamp, level, message, context, error } = logEntry;
      const contextStr = context ? ` ${JSON.stringify(context)}` : '';
      const errorStr = error ? `\nError: ${error.name}: ${error.message}` : '';
      
      console.log(`[${timestamp}] ${level}: ${message}${contextStr}${errorStr}`);
    }
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.writeLog(this.formatLog('ERROR', message, context, error));
  }

  warn(message: string, context?: Record<string, any>): void {
    this.writeLog(this.formatLog('WARN', message, context));
  }

  info(message: string, context?: Record<string, any>): void {
    this.writeLog(this.formatLog('INFO', message, context));
  }

  debug(message: string, context?: Record<string, any>): void {
    this.writeLog(this.formatLog('DEBUG', message, context));
  }

  // Specialized logging methods
  apiRequest(method: string, url: string, statusCode: number, responseTime: number, userId?: string): void {
    this.info('API Request', {
      method,
      url,
      statusCode,
      responseTime,
      userId,
    });
  }

  databaseQuery(query: string, duration: number, error?: Error): void {
    if (error) {
      this.error('Database Query Failed', { query, duration }, error);
    } else {
      this.debug('Database Query', { query, duration });
    }
  }

  userAction(action: string, userId: string, context?: Record<string, any>): void {
    this.info('User Action', {
      action,
      userId,
      ...context,
    });
  }

  securityEvent(event: string, context?: Record<string, any>): void {
    this.warn('Security Event', {
      event,
      ...context,
    });
  }

  performanceMetric(metric: string, value: number, context?: Record<string, any>): void {
    this.info('Performance Metric', {
      metric,
      value,
      ...context,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for use in other files
export type { LogEntry, LogLevel };




