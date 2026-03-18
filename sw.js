const CACHE = 'edumatrix-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/src/style.css',
  '/src/app.js',
  '/manifest.json'
];

// Install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/')) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).catch(() => caches.match('/index.html'));
    })
  );
});

// ── PUSH NOTIFICATION ──────────────────────────────────────────────────────
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || 'EduMatrix School';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/public/icons/icon-192.png',
    badge: '/public/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'close', title: 'Dismiss' }
    ]
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// Click on notification
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'close') return;
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
