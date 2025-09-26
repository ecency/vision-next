// Enhanced service worker with better handling for stale cache issues
// This script will be concatenated with the generated service worker

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Listen for failed network requests (chunk loading failures)
self.addEventListener('fetch', event => {
  // Only handle GET requests for JavaScript chunks
  if (event.request.method === 'GET' && event.request.url.includes('/_next/static/chunks/')) {
    event.respondWith(
      fetch(event.request)
        .catch(error => {
          console.warn('Chunk fetch failed, attempting cache cleanup:', event.request.url);
          
          // If chunk fetch fails, clear related caches and try again
          return caches.keys().then(cacheNames => {
            const nextCaches = cacheNames.filter(name => name.startsWith('next-'));
            return Promise.all(
              nextCaches.map(cacheName => caches.delete(cacheName))
            );
          }).then(() => {
            // Try fetch again after cache clear
            return fetch(event.request);
          }).catch(finalError => {
            // If still fails, this is likely a stale chunk issue
            console.error('Chunk still failed after cache clear:', event.request.url);
            
            // Return a response that will trigger a page reload
            return new Response(
              `// Chunk load failed - reload required
              if (typeof window !== 'undefined') {
                console.warn('Stale chunk detected, reloading page');
                window.location.reload();
              }`,
              {
                status: 200,
                headers: { 'Content-Type': 'application/javascript' }
              }
            );
          });
        })
    );
  }
});

// Handle installation of new service worker
self.addEventListener('install', event => {
  console.log('Service worker installing...');
  // Skip waiting to immediately take control
  self.skipWaiting();
});

// Handle activation of new service worker
self.addEventListener('activate', event => {
  console.log('Service worker activating...');
  
  event.waitUntil(
    // Clean up old caches on activation
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old version caches
          if (cacheName.startsWith('next-') || cacheName.startsWith('static-')) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Periodically check for updates
setInterval(() => {
  self.registration.update();
}, 30000); // Check every 30 seconds