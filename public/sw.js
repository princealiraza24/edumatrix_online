const CACHE = 'edumatrix-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/src/style.css',
  '/src/app.js',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/')) return;
  if (e.request.url.includes('/school.config.js')) return;
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).catch(() => caches.match('/index.html'))
    )
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(
    data.title || 'EduMatrix School', {
    body:     data.body || 'You have a new notification',
    icon:     '/icons/icon-192.png',
    badge:    '/icons/icon-192.png',
    vibrate:  [300, 100, 300],
    tag:      'edumatrix-notif',
    renotify: true,
    data:     { url: data.url || '/' },
    actions: [
      { action: 'open',  title: '📱 Open App' },
      { action: 'close', title: '✕ Dismiss'  }
    ]
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'close') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) if ('focus' in c) return c.focus();
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
