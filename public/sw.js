const CACHE_NAME = 'desayner-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only intercept same-origin HTML navigation requests for offline fallback.
  // Skip all non-GET requests (PUT uploads to R2, POST API calls, etc.)
  // so the service worker never interferes with network-only operations.
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          '<html><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      })
    );
  }
  // All other GET requests (scripts, images, API calls) pass through normally
  // without service worker interception.
});
