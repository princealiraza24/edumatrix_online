const CACHE = 'edumatrix-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/src/style.css',
  '/src/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/')) return;
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).catch(() => caches.match('/index.html'))
    )
  );
});

// ── PUSH NOTIFICATIONS ─────────────────────────────────────────────────────
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};

  const title = data.title || 'EduMatrix School';
  const body  = data.body  || 'You have a new notification';

  const options = {
    body:    body,
    icon:    '/icons/icon-192.png',
    badge:   '/icons/icon-192.png',
    vibrate: [300, 100, 300],
    tag:     'edumatrix-notif',
    renotify: true,
    data:    { url: data.url || '/' },
    actions: [
      { action: 'open',  title: '📱 Open App' },
      { action: 'close', title: '✕ Dismiss'   }
    ]
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

// ── NOTIFICATION CLICK ─────────────────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'close') return;
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('edumatrix') && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
