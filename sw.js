// Lantern Hop service worker: offline app shell.
const CACHE_VERSION = 'v12';
const CACHE = 'lantern-hop-' + CACHE_VERSION;
const FONT_CACHE = 'lantern-hop-fonts';
const SHELL = ['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== FONT_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(caches.open(FONT_CACHE).then(async cache => {
      const hit = await cache.match(req);
      const fresh = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || fresh;
    }));
    return;
  }
  if (url.origin === self.location.origin) {
    event.respondWith(caches.match(req, {ignoreSearch:true}).then(hit => hit || fetch(req).catch(() => req.mode === 'navigate' ? caches.match('./index.html') : undefined)));
  }
});
