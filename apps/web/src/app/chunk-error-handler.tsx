"use client";

import { useEffect } from "react";

/**
 * ChunkErrorHandler component that handles ChunkLoadError events.
 * When a chunk fails to load (typically due to deployment asset mismatch),
 * this component forces a hard page reload to fetch the latest version.
 */
export function ChunkErrorHandler() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = event.error;
      
      // Check if this is a ChunkLoadError
      if (error?.name === "ChunkLoadError" || 
          (error?.message && error.message.includes("Loading chunk")) ||
          (error?.message && error.message.includes("failed to fetch"))) {
        
        // Prevent infinite reload loops by checking if we already reloaded recently
        const lastReload = sessionStorage.getItem("chunk-error-reload");
        const now = Date.now();
        
        if (!lastReload || now - parseInt(lastReload) > 10000) {
          // Store reload timestamp
          sessionStorage.setItem("chunk-error-reload", now.toString());
          
          // Force a hard reload to get the latest chunks
          window.location.reload();
        }
      }
    };

    // Listen for unhandled errors
    window.addEventListener("error", handleError);

    // Also handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      
      if (reason?.name === "ChunkLoadError" || 
          (reason?.message && reason.message.includes("Loading chunk")) ||
          (reason?.message && reason.message.includes("failed to fetch"))) {
        
        const lastReload = sessionStorage.getItem("chunk-error-reload");
        const now = Date.now();
        
        if (!lastReload || now - parseInt(lastReload) > 10000) {
          sessionStorage.setItem("chunk-error-reload", now.toString());
          window.location.reload();
        }
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}