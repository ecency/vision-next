"use client";

import { ComponentType, FC, lazy, LazyExoticComponent, ReactNode, Suspense } from "react";
import * as Sentry from "@sentry/nextjs";

interface RetryableImportOptions {
  maxRetries?: number;
  retryDelay?: number;
  fallback?: ReactNode;
  onError?: (error: Error, retry: () => void) => void;
}

/**
 * Creates a retryable dynamic import that handles chunk loading failures
 */
export function createRetryableDynamicImport<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T } | T>,
  options: RetryableImportOptions = {}
): LazyExoticComponent<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError
  } = options;

  const retryableImport = async (attempt = 1): Promise<{ default: T }> => {
    try {
      const module = await importFn();
      
      // Handle both default exports and direct exports
      return 'default' in module ? module : { default: module as T };
    } catch (error) {
      const isChunkError = error instanceof Error && (
        error.name === "ChunkLoadError" ||
        error.message.includes("Loading chunk") ||
        error.message.includes("Failed to load")
      );

      console.error(`Dynamic import attempt ${attempt} failed:`, error);

      if (isChunkError && attempt < maxRetries) {
        console.log(`Retrying dynamic import in ${retryDelay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        
        // Try to clear caches before retry
        if ('caches' in window) {
          try {
            const cacheKeys = await caches.keys();
            for (const key of cacheKeys) {
              if (key.includes('static') || key.includes('chunks')) {
                await caches.delete(key);
              }
            }
          } catch (cacheError) {
            console.warn("Failed to clear caches during retry:", cacheError);
          }
        }
        
        return retryableImport(attempt + 1);
      }

      // If we've exhausted retries or it's not a chunk error, report and re-throw
      if (isChunkError) {
        Sentry.captureException(error, {
          tags: {
            errorType: "ChunkLoadError",
            component: "RetryableDynamicImport",
            attempts: attempt
          },
          extra: {
            maxRetries,
            userAgent: navigator.userAgent,
            currentUrl: window.location.href
          }
        });

        // Call error handler if provided
        if (onError) {
          onError(error as Error, () => {
            // Force reload as last resort
            window.location.reload();
          });
        }
      }

      throw error;
    }
  };

  return lazy(retryableImport);
}

/**
 * Higher-order component that wraps dynamic imports with retry logic and error boundaries
 */
interface RetryableDynamicComponentProps {
  importFn: () => Promise<{ default: ComponentType<any> } | ComponentType<any>>;
  options?: RetryableImportOptions;
  componentProps?: any;
  children?: ReactNode;
}

export const RetryableDynamicComponent: FC<RetryableDynamicComponentProps> = ({
  importFn,
  options = {},
  componentProps = {},
  children
}) => {
  const { fallback = <div>Loading...</div> } = options;
  
  const LazyComponent = createRetryableDynamicImport(importFn, options);

  return (
    <Suspense fallback={fallback}>
      <LazyComponent {...componentProps}>
        {children}
      </LazyComponent>
    </Suspense>
  );
};

/**
 * Utility function to enhance existing dynamic imports with retry logic
 */
export function withRetry<T extends ComponentType<any>>(
  lazyComponent: LazyExoticComponent<T>,
  options: RetryableImportOptions = {}
): LazyExoticComponent<T> {
  // Since we can't easily wrap an existing lazy component, we return it as-is
  // This is more of a marker function for future enhancement
  return lazyComponent;
}

/**
 * Hook to preload chunks with retry logic
 */
export function useChunkPreloader() {
  const preloadChunk = async (
    importFn: () => Promise<any>,
    maxRetries = 3
  ): Promise<boolean> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await importFn();
        return true;
      } catch (error) {
        console.warn(`Chunk preload attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    return false;
  };

  return { preloadChunk };
}