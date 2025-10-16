"use client";

import { useEffect } from "react";

/**
 * ServiceWorkerManager component handles service worker lifecycle and updates.
 * It ensures that when a new deployment happens, the old service worker is replaced
 * and the page is reloaded to fetch fresh assets.
 */
export function ServiceWorkerManager() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let refreshing = false;

    // Listen for the controlling service worker changing and reload the page
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      console.log("[SW] Controller changed, reloading page to get new assets");
      window.location.reload();
    });

    // Function to check for service worker updates
    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          console.log("[SW] No service worker registration found");
          return;
        }

        // Check for updates
        await registration.update();

        // If there's a waiting service worker, activate it immediately
        if (registration.waiting) {
          console.log("[SW] New service worker waiting, activating...");
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        // Listen for new service workers installing
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          console.log("[SW] New service worker installing");

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New service worker is installed and ready
              console.log("[SW] New service worker installed, will activate on next page load");
              
              // Tell the service worker to skip waiting and activate immediately
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      } catch (error) {
        console.error("[SW] Error checking for updates:", error);
      }
    };

    // Check for updates immediately
    checkForUpdates();

    // Check for updates every 60 seconds
    const intervalId = setInterval(checkForUpdates, 60000);

    // Also check when the page becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForUpdates();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}