"use client";

import { useEffect } from "react";

/**
 * Enhanced error logging specifically for chunk loading failures
 * This helps with debugging and monitoring chunk-related issues
 */
export function ChunkErrorLogger() {
  useEffect(() => {
    const logChunkError = (error: any, context: string) => {
      const errorInfo = {
        timestamp: new Date().toISOString(),
        context,
        error: {
          name: error?.name,
          message: error?.message,
          stack: error?.stack
        },
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer,
        connectionType: (navigator as any)?.connection?.effectiveType || 'unknown',
        onlineStatus: navigator.onLine
      };

      console.error(`[ChunkErrorLogger] ${context}:`, errorInfo);

      // Send to Sentry for monitoring (if available)
      if (typeof window !== "undefined" && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: {
            errorType: 'chunk_loading_error',
            context
          },
          extra: errorInfo
        });
      }
    };

    const handleGlobalError = (event: ErrorEvent) => {
      if (
        event.error &&
        (event.error.name === "ChunkLoadError" || 
         event.message?.includes("Loading chunk") || 
         event.message?.includes("ChunkLoadError"))
      ) {
        logChunkError(event.error, 'global_error_handler');
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason &&
        (event.reason.name === "ChunkLoadError" ||
         event.reason.message?.includes("Loading chunk") ||
         event.reason.message?.includes("ChunkLoadError"))
      ) {
        logChunkError(event.reason, 'unhandled_promise_rejection');
      }
    };

    // Also log network-related errors that might affect chunk loading
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target && target.tagName === 'SCRIPT') {
        const src = (target as HTMLScriptElement).src;
        if (src && src.includes('/_next/static/chunks/')) {
          logChunkError({
            name: 'ScriptLoadError',
            message: `Failed to load script: ${src}`,
            src
          }, 'script_load_error');
        }
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleResourceError, true); // Use capture phase for resource errors

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleResourceError, true);
    };
  }, []);

  return null;
}