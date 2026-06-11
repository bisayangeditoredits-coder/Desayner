const CACHE_NAME = 'desayner-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch for basic PWA validation
  // This is required for Chrome to trigger the "Add to Homescreen" banner
  event.respondWith(fetch(event.request).catch(() => new Response('Offline')));
});
