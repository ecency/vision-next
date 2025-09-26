"use client";

import { useEffect, useRef, useState } from "react";
import * as Sentry from "@sentry/nextjs";

interface StaleServiceWorkerState {
  isStale: boolean;
  buildId: string | null;
  serverBuildId: string | null;
}

/**
 * Hook to detect stale service workers by comparing build IDs
 */
export function useStaleServiceWorkerDetector() {
  const [state, setState] = useState<StaleServiceWorkerState>({
    isStale: false,
    buildId: null,
    serverBuildId: null,
  });
  
  const checkIntervalRef = useRef<NodeJS.Timeout>();

  const getCurrentBuildId = (): string | null => {
    try {
      // Extract build ID from Next.js app chunks
      const scripts = document.querySelectorAll('script[src*="/_next/static/"]');
      for (const script of scripts) {
        const src = script.getAttribute('src');
        if (src) {
          const match = src.match(/\/_next\/static\/([^\/]+)\//);
          if (match) {
            return match[1];
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Failed to extract build ID:", error);
      return null;
    }
  };

  const fetchServerBuildId = async (): Promise<string | null> => {
    try {
      // Try to fetch a minimal HTML page to get current build ID
      const response = await fetch('/', { 
        method: 'HEAD',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      // If we can get the actual page, parse it for build ID
      const htmlResponse = await fetch('/', { 
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (htmlResponse.ok) {
        const html = await htmlResponse.text();
        const match = html.match(/\/_next\/static\/([^\/]+)\//);
        if (match) {
          return match[1];
        }
      }
      
      return null;
    } catch (error) {
      console.error("Failed to fetch server build ID:", error);
      return null;
    }
  };

  const checkForStaleness = async () => {
    try {
      const currentBuildId = getCurrentBuildId();
      const serverBuildId = await fetchServerBuildId();
      
      setState(prev => ({
        ...prev,
        buildId: currentBuildId,
        serverBuildId: serverBuildId,
        isStale: !!(currentBuildId && serverBuildId && currentBuildId !== serverBuildId)
      }));
      
      if (currentBuildId && serverBuildId && currentBuildId !== serverBuildId) {
        console.warn("Stale service worker detected:", { currentBuildId, serverBuildId });
        
        Sentry.addBreadcrumb({
          message: "Stale service worker detected",
          level: "warning",
          data: { currentBuildId, serverBuildId }
        });
      }
    } catch (error) {
      console.error("Error checking for service worker staleness:", error);
    }
  };

  const forceRefresh = async () => {
    try {
      // Try to update service worker first
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          
          // Skip waiting if there's a waiting worker
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      }
      
      // Clear caches
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
      }
      
      // Hard refresh
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error("Failed to force refresh:", error);
      // Fallback to simple reload
      window.location.reload();
    }
  };

  useEffect(() => {
    // Initial check
    checkForStaleness();
    
    // Periodic check every 2 minutes
    checkIntervalRef.current = setInterval(checkForStaleness, 120000);
    
    // Check when page becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForStaleness();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    ...state,
    forceRefresh,
    checkForStaleness
  };
}

export function StaleServiceWorkerDetector() {
  const { isStale, forceRefresh } = useStaleServiceWorkerDetector();
  
  useEffect(() => {
    if (isStale) {
      // Auto-refresh if stale (configurable behavior)
      console.log("Auto-refreshing due to stale service worker");
      forceRefresh();
    }
  }, [isStale, forceRefresh]);

  return null; // This is a detector component, no UI
}