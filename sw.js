const CACHE_NAME = 'rathod-hub-v17';
const COLLECTION_CLEANUP = `/* collection force cleanup */
(function(){
  function clean(){
    ['btn-collection','mob-collection','section-collection','collection-mini','rh-student-collection-mini','rh-student-collection-card','student-profile-modal','community-profile-modal'].forEach(function(id){
      var el=document.getElementById(id);
      if(el && el.parentNode) el.parentNode.removeChild(el);
    });
    document.querySelectorAll('[id*="collection"],[class*="collection"]').forEach(function(el){
      if(String(el.id||'').toLowerCase().includes('collection')) el.remove();
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', clean); else clean();
  setInterval(clean, 1000);
})();`;
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
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const path = url.pathname;

  if (path.endsWith('/student-collection.js') || path.endsWith('student-collection.js')) {
    event.respondWith(new Response(COLLECTION_CLEANUP, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    }));
    return;
  }

  if (path.includes('/models/') || path.endsWith('/club-world.html')) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html').then(hit => hit || caches.match('./')))
    );
    return;
  }

  event.respondWith(
    fetch(request, { cache: 'no-store' }).then(response => {
      if (response && response.ok && !path.endsWith('/student-collection.js')) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    }).catch(() => caches.match(request))
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
