"use client";

import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { EcencyConfigManager } from "@/config";

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  hasUpdate: boolean;
  isUpdating: boolean;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
}

export function ServiceWorkerManager() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    hasUpdate: false,
    isUpdating: false,
    registration: null,
    error: null,
  });

  const updateServiceWorker = async () => {
    if (!state.registration) return;

    try {
      setState(prev => ({ ...prev, isUpdating: true }));
      
      // Skip waiting and claim clients immediately
      if (state.registration.waiting) {
        state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      
      // Force refresh after a short delay to allow SW to update
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Failed to update service worker:", error);
      Sentry.captureException(error, {
        tags: { component: "ServiceWorkerManager" },
        extra: { action: "updateServiceWorker" }
      });
    }
  };

  const checkForUpdates = async () => {
    if (!state.registration) return;

    try {
      await state.registration.update();
    } catch (error) {
      console.error("Failed to check for service worker updates:", error);
      Sentry.captureException(error, {
        tags: { component: "ServiceWorkerManager" },
        extra: { action: "checkForUpdates" }
      });
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      setState(prev => ({ ...prev, isSupported: false }));
      return;
    }

    setState(prev => ({ ...prev, isSupported: true }));

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        
        setState(prev => ({ 
          ...prev, 
          isRegistered: true, 
          registration 
        }));

        // Listen for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New service worker is available
              setState(prev => ({ ...prev, hasUpdate: true }));
            }
          });
        });

        // Listen for controlling service worker changes
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          // Service worker has been updated and is now controlling the page
          if (state.isUpdating) {
            window.location.reload();
          }
        });

        // Check for updates periodically
        setInterval(checkForUpdates, 30000); // Check every 30 seconds

      } catch (error) {
        console.error("Service worker registration failed:", error);
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : "Registration failed" 
        }));
        
        Sentry.captureException(error, {
          tags: { component: "ServiceWorkerManager" },
          extra: { action: "register" }
        });
      }
    };

    registerServiceWorker();
  }, [state.isUpdating]);

  // Auto-update service worker when available (configurable)
  useEffect(() => {
    if (state.hasUpdate) {
      EcencyConfigManager.withConfig(({ visionFeatures }) => {
        if (visionFeatures.pwa?.autoUpdateServiceWorker) {
          updateServiceWorker();
        }
      });
    }
  }, [state.hasUpdate]);

  // Expose functions globally for debugging and manual control
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__serviceWorkerManager = {
        state,
        updateServiceWorker,
        checkForUpdates,
      };
    }
  }, [state]);

  return null; // This is a manager component, no UI
}