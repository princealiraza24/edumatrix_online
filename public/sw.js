const CACHE = 'edumatrix-v1';
const ASSETS = [
  '/',                   // SPA root
  '/index.html',          // main HTML
  '/src/style.css',       // static CSS
  '/src/app.js',          // static JS
  '/manifest.json',       // PWA manifest
  '/icons/icon-192.png',  // icon cache
  '/icons/icon-512.png'   // icon cache
];

// Install SW
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate SW
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/')) return; // skip API calls
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).catch(() => caches.match('/index.html'));
    })
  );
});

// Push notification
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || 'EduMatrix School';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192.png',   // correct path
    badge: '/icons/icon-192.png',  // correct path
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'close', title: 'Dismiss' }
    ]
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// Notification click
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'close') return;
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(e.notification.data.url);
    })
  );
});
