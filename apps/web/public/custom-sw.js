// Custom service worker event handlers to be injected into the generated service worker

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message, activating new service worker');
    self.skipWaiting();
  }
});

// When the service worker is activated, claim all clients and clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated');
  
  event.waitUntil(
    Promise.all([
      // Claim all clients immediately
      self.clients.claim(),
      
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete all caches - next-pwa will recreate them with the new content
            console.log(`[SW] Deleting cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
      })
    ]).then(() => {
      console.log('[SW] All old caches cleared, clients claimed');
    })
  );
});

// Install event - skip waiting immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Service worker installing');
  // Skip the waiting phase and activate immediately
  self.skipWaiting();
});