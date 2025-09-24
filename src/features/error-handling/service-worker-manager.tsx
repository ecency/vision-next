"use client";

import { useEffect } from 'react';

/**
 * Service Worker Manager component
 * Handles service worker registration, updates, and cache management
 */
export function ServiceWorkerManager() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('SW registered:', registration);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker is available
                  console.log('New SW available');
                  
                  // Optionally show user notification for update
                  if (confirm('A new version is available. Reload to update?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });

          // Handle controlled page reloads
          let refreshing = false;
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
              refreshing = true;
              window.location.reload();
            }
          });
        })
        .catch((err) => {
          console.log('SW registration failed:', err);
        });

      // Listen for SW messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          console.log('Cache updated:', event.data);
        }
      });

      // Handle online/offline events
      const handleOnline = () => {
        console.log('App is online');
        // Clear failed chunk cache when coming back online
        if ('caches' in window) {
          caches.open('failed-chunks').then(cache => {
            cache.keys().then(requests => {
              requests.forEach(request => cache.delete(request));
            });
          });
        }
      };

      const handleOffline = () => {
        console.log('App is offline');
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Cleanup
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return null;
}