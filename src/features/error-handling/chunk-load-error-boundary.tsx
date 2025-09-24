"use client";

import React, { Component, ReactNode } from 'react';
import { Button } from '@ui/button';

interface ChunkLoadErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

interface ChunkLoadErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  maxRetries?: number;
}

class ChunkLoadErrorBoundary extends Component<ChunkLoadErrorBoundaryProps, ChunkLoadErrorBoundaryState> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: ChunkLoadErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ChunkLoadErrorBoundaryState> {
    // Check if this is a chunk loading error
    const isChunkLoadError = 
      error.name === 'ChunkLoadError' ||
      error.message.includes('Loading chunk') ||
      error.message.includes('Loading CSS chunk') ||
      error.message.includes('Loading script failed');

    if (isChunkLoadError) {
      return {
        hasError: true,
        error,
      };
    }

    return {};
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log chunk loading errors
    if (this.isChunkLoadError(error)) {
      console.error('Chunk loading error caught by boundary:', error, errorInfo);
      
      // Attempt automatic retry with exponential backoff
      this.handleAutomaticRetry();
    }
  }

  componentWillUnmount() {
    // Clean up any pending timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private isChunkLoadError(error: Error): boolean {
    return (
      error.name === 'ChunkLoadError' ||
      error.message.includes('Loading chunk') ||
      error.message.includes('Loading CSS chunk') ||
      error.message.includes('Loading script failed') ||
      error.message.includes('Cannot read property \'parentNode\' of null')
    );
  }

  private handleAutomaticRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, retryCount) * 1000;
      
      const timeout = setTimeout(() => {
        this.setState(prevState => ({
          hasError: false,
          retryCount: prevState.retryCount + 1,
        }));
      }, delay);

      this.retryTimeouts.push(timeout);
    }
  };

  private handleManualRetry = () => {
    this.setState({
      hasError: false,
      retryCount: 0,
    });
  };

  private handleReload = () => {
    // Clear cache and reload the page
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback, maxRetries = 3 } = this.props;

    if (hasError && this.isChunkLoadError(error!)) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Loading Error
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              There was an issue loading part of the application. This usually happens during updates.
            </p>
            
            {retryCount < maxRetries ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Retrying automatically... ({retryCount + 1}/{maxRetries})
                </p>
                <Button onClick={this.handleManualRetry} variant="outline">
                  Try Again Now
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Automatic retries exhausted. Please reload the page.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={this.handleManualRetry} variant="outline">
                    Try Again
                  </Button>
                  <Button onClick={this.handleReload}>
                    Reload Page
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ChunkLoadErrorBoundary;