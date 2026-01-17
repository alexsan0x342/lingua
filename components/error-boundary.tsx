'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorId: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorId: string = '';

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Generate unique error ID for tracking
    this.errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log error in production
    if (process.env.NODE_ENV === 'production') {
      this.logError(error, errorInfo);
    } else {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
  }

  private async logError(error: Error, errorInfo: React.ErrorInfo) {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.errorId,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.getUserId(),
      };

      // Send to logging service
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      });
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  }

  private getUserId(): string | undefined {
    // Extract user ID from session storage, local storage, or cookie
    try {
      const sessionData = sessionStorage.getItem('user-session');
      if (sessionData) {
        return JSON.parse(sessionData).userId;
      }
    } catch {
      // Ignore parsing errors
    }
    return undefined;
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.errorId = '';
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error!}
          resetError={this.resetError}
          errorId={this.errorId}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, resetError, errorId }: ErrorFallbackProps) {
  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Oops! Something went wrong
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {isProduction
                ? "We're sorry, but something unexpected happened. Our team has been notified."
                : "An error occurred while rendering this component."
              }
            </p>
            
            {errorId && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                Error ID: {errorId}
              </p>
            )}
            
            {!isProduction && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                  Technical Details
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-gray-100 dark:bg-gray-800 p-3 text-xs text-gray-800 dark:text-gray-200">
                  {error.message}
                  {error.stack && `\n\n${error.stack}`}
                </pre>
              </details>
            )}
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button 
              onClick={resetError} 
              className="flex-1"
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            
            <Button asChild className="flex-1">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </div>
          
          {isProduction && (
            <p className="text-xs text-center text-gray-500 dark:text-gray-500">
              If this problem persists, please contact support with the error ID above.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Custom error fallback for specific sections
export function MinimalErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            Something went wrong
          </p>
          <p className="text-xs text-red-600 dark:text-red-400">
            {process.env.NODE_ENV === 'production' 
              ? 'Please try refreshing the page'
              : error.message
            }
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={resetError}
          className="text-red-700 border-red-300 hover:bg-red-100 dark:text-red-300 dark:border-red-700 dark:hover:bg-red-900/30"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}