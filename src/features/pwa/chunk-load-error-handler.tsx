"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

interface ChunkLoadError extends Error {
  name: "ChunkLoadError";
  request?: string;
}

const isChunkLoadError = (error: any): error is ChunkLoadError => {
  return error?.name === "ChunkLoadError" || 
         error?.message?.includes("Loading chunk") ||
         error?.message?.includes("ChunkLoadError");
};

const retryChunkLoad = async (chunkUrl: string, maxRetries = 3): Promise<boolean> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Try to fetch the chunk directly
      const response = await fetch(chunkUrl);
      if (response.ok) {
        return true;
      }
      
      // If it's a 404, the chunk probably doesn't exist anymore
      if (response.status === 404) {
        console.warn(`Chunk not found (404): ${chunkUrl}`);
        return false;
      }
      
      // For other errors, wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    } catch (fetchError) {
      console.warn(`Retry ${attempt}/${maxRetries} failed for chunk: ${chunkUrl}`, fetchError);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  return false;
};

const handleChunkLoadError = async (error: ChunkLoadError) => {
  console.error("Chunk load error detected:", error);
  
  // Extract chunk URL from error
  const chunkUrl = error.request || extractChunkUrlFromMessage(error.message);
  
  if (chunkUrl) {
    console.log(`Attempting to retry chunk load: ${chunkUrl}`);
    
    const retrySuccess = await retryChunkLoad(chunkUrl);
    
    if (!retrySuccess) {
      console.error(`Failed to retry chunk load after multiple attempts: ${chunkUrl}`);
      
      // Check if this looks like a stale service worker issue
      if (chunkUrl.includes("/_next/static/chunks/")) {
        console.warn("Stale service worker detected, attempting to refresh application");
        
        // Try to update service worker
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
              await registration.update();
              
              // Force a hard refresh to get the new version
              setTimeout(() => {
                window.location.reload();
              }, 1000);
              
              return;
            }
          } catch (swError) {
            console.error("Failed to update service worker:", swError);
          }
        }
        
        // Fallback: force hard refresh
        console.warn("Forcing hard refresh due to chunk load failure");
        window.location.reload();
      }
    } else {
      console.log(`Successfully retried chunk load: ${chunkUrl}`);
    }
  }
  
  // Report to Sentry with enhanced context
  Sentry.captureException(error, {
    tags: {
      errorType: "ChunkLoadError",
      component: "ChunkLoadErrorHandler"
    },
    extra: {
      chunkUrl,
      userAgent: navigator.userAgent,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      currentUrl: window.location.href,
      timestamp: new Date().toISOString()
    }
  });
};

const extractChunkUrlFromMessage = (message: string): string | null => {
  // Extract URL from common chunk error message patterns
  const patterns = [
    /Loading chunk \d+ failed\.\s*\(missing: (.+)\)/,
    /ChunkLoadError: Loading chunk \d+ failed\.\s*\(missing: (.+)\)/,
    /https?:\/\/[^\s)]+\.js/
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  
  return null;
};

export function ChunkLoadErrorHandler() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = event.error;
      
      if (isChunkLoadError(error)) {
        event.preventDefault(); // Prevent default error handling
        handleChunkLoadError(error);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      
      if (isChunkLoadError(error)) {
        event.preventDefault(); // Prevent default unhandled rejection handling
        handleChunkLoadError(error);
      }
    };

    // Listen for chunk load errors
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null; // This is a handler component, no UI
}