const CACHE_NAME = 'rathod-hub-v20-ui-fix';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './rathod-modern-theme.css',
  './rathod-modern-effects.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).catch(() => null));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then(clients => clients.forEach(client => client.postMessage({ type: 'RH_CACHE_REFRESHED' })))
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const path = url.pathname;

  // Always fetch latest HTML/JS/CSS so GitHub Pages updates appear immediately.
  if (request.mode === 'navigate' || path.endsWith('/index.html') || path.endsWith('/rathod-modern-effects.js') || path.endsWith('/rathod-modern-theme.css') || path.endsWith('/student-collection.js')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request.mode === 'navigate' ? './index.html' : request, copy));
          return response;
        })
        .catch(() => caches.match(request).then(hit => hit || caches.match('./index.html') || caches.match('./')))
    );
    return;
  }

  if (path.includes('/models/') || path.endsWith('/club-world.html')) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
      return network || cached;
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification.data?.url || './index.html';
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const client of list){if('focus'in client){client.postMessage({type:'OPEN_HUB_NOTIFICATION',payload:event.notification.data||{}});return client.focus()}}
    return clients.openWindow?clients.openWindow(target):null;
  }));
});
