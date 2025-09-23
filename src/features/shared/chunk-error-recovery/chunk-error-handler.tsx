"use client";

import { useEffect, useRef } from "react";

interface ChunkErrorHandlerProps {
  children: React.ReactNode;
  onChunkError?: () => void;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Component that handles chunk loading errors and provides graceful recovery
 * by detecting ChunkLoadError and implementing retry/refresh logic
 */
export function ChunkErrorHandler({
  children,
  onChunkError,
  maxRetries = 3,
  retryDelay = 1000
}: ChunkErrorHandlerProps) {
  const retryCountRef = useRef(0);
  const hasHandledErrorRef = useRef(false);

  useEffect(() => {
    const handleChunkError = (event: ErrorEvent) => {
      // Check if the error is a ChunkLoadError
      if (
        event.error &&
        (event.error.name === "ChunkLoadError" || 
         event.message?.includes("Loading chunk") || 
         event.message?.includes("ChunkLoadError"))
      ) {
        console.error("ChunkLoadError detected:", event.error);
        
        // Prevent multiple handling of the same error
        if (hasHandledErrorRef.current) {
          return;
        }
        hasHandledErrorRef.current = true;

        // Call custom error handler if provided
        if (onChunkError) {
          onChunkError();
        }

        // Implement retry logic
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(`Attempting chunk reload retry ${retryCountRef.current}/${maxRetries}`);
          
          setTimeout(() => {
            hasHandledErrorRef.current = false;
            window.location.reload();
          }, retryDelay * retryCountRef.current);
        } else {
          // If retries are exhausted, force a hard refresh to clear cache
          console.log("Max retries reached, performing hard refresh");
          window.location.href = window.location.href;
        }
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Check if the rejection is related to chunk loading
      if (
        event.reason &&
        (event.reason.name === "ChunkLoadError" ||
         event.reason.message?.includes("Loading chunk") ||
         event.reason.message?.includes("ChunkLoadError"))
      ) {
        console.error("ChunkLoadError in promise rejection:", event.reason);
        
        // Prevent multiple handling of the same error
        if (hasHandledErrorRef.current) {
          return;
        }
        hasHandledErrorRef.current = true;

        // Call custom error handler if provided
        if (onChunkError) {
          onChunkError();
        }

        // Implement retry logic
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(`Attempting chunk reload retry ${retryCountRef.current}/${maxRetries}`);
          
          setTimeout(() => {
            hasHandledErrorRef.current = false;
            window.location.reload();
          }, retryDelay * retryCountRef.current);
        } else {
          // If retries are exhausted, force a hard refresh to clear cache
          console.log("Max retries reached, performing hard refresh");
          window.location.href = window.location.href;
        }
      }
    };

    // Listen for both error events and unhandled promise rejections
    window.addEventListener("error", handleChunkError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleChunkError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [onChunkError, maxRetries, retryDelay]);

  return <>{children}</>;
}