const CACHE = 'apptraining-v1';
const ASSETS = ['/AppTraining/', '/AppTraining/index.html', '/AppTraining/manifest.json'];

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
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'AppTraining', body: '' };
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/AppTraining/icons/icon-192.png',
    badge: '/AppTraining/icons/icon-192.png'
  }));
});
