"use client";

import React, { Component, ReactNode, ErrorInfo } from "react";
import * as Sentry from "@sentry/nextjs";

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, retry: () => void) => ReactNode);
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Detects if an error is a chunk load error
 */
const isChunkLoadError = (error: Error): boolean => {
  return (
    error.name === "ChunkLoadError" ||
    (error.message && error.message.includes("Loading chunk")) ||
    (error.message && error.message.includes("Failed to load")) ||
    (error.stack && error.stack.includes("ChunkLoadError"))
  );
};

/**
 * Error boundary component that specifically handles chunk loading errors
 * and provides a retry mechanism
 */
export class ChunkLoadErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (isChunkLoadError(error)) {
      console.error("Chunk load error caught in boundary:", error);
      
      // Report to Sentry with enhanced context
      Sentry.captureException(error, {
        tags: {
          errorType: "ChunkLoadError",
          component: "ChunkLoadErrorBoundary"
        },
        extra: {
          componentStack: errorInfo.componentStack,
          userAgent: navigator.userAgent,
          serviceWorkerSupported: 'serviceWorker' in navigator,
          currentUrl: window.location.href,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      // For non-chunk errors, report them normally
      console.error("Error caught in boundary:", error, errorInfo);
      Sentry.captureException(error, {
        extra: {
          componentStack: errorInfo.componentStack
        }
      });
    }
  }

  /**
   * Attempt to recover from the error by:
   * 1. For chunk errors - attempting to reload the missing resources
   * 2. Resetting the error state to trigger a re-render
   */
  handleRetry = async (): Promise<void> => {
    const { error } = this.state;
    
    if (error && isChunkLoadError(error)) {
      try {
        // For chunk load errors, try first to refresh the service worker
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            await registration.update();
            console.log("Service worker updated");
          }
        }
        
        // Then clear application cache to fetch fresh chunks
        if ('caches' in window) {
          try {
            const cacheKeys = await caches.keys();
            for (const key of cacheKeys) {
              if (key.startsWith('next-')) {
                await caches.delete(key);
                console.log(`Cache deleted: ${key}`);
              }
            }
          } catch (cacheError) {
            console.error("Failed to clear caches:", cacheError);
          }
        }
      } catch (e) {
        console.error("Error while trying to recover from chunk load error:", e);
      }
    }
    
    // Reset error state to retry rendering
    this.setState({ hasError: false, error: null });
  };

  /**
   * Handle hard refresh when normal retry doesn't work
   */
  handleHardRefresh = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        if (typeof fallback === "function") {
          return fallback(error, this.handleRetry);
        }
        return fallback;
      }

      // Default fallback UI
      return (
        <div className="p-4 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
          <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-300">
            {isChunkLoadError(error) ? "Application resource failed to load" : "Something went wrong"}
          </h3>
          <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
            {isChunkLoadError(error)
              ? "We're having trouble loading some resources. This might be due to a recent update or network issue."
              : "We've encountered an unexpected error."}
          </p>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-100 dark:hover:bg-yellow-700"
            >
              Try again
            </button>
            <button
              onClick={this.handleHardRefresh}
              className="px-4 py-2 text-sm font-medium rounded-md text-gray-800 bg-white hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}