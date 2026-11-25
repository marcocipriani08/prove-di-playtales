// Quiz of Us: lets the game open without a connection from the home-screen icon (copied from the original, commit c7c92b0;
// build.js puts it next to the delivered game, with the name of the cache for that order and version).
// The page is fetched from the network first (so a new version arrives as soon as there is a connection) and kept as a
// copy for when there is none; icons and the manifest come from the copy. The fonts are inside the page.
const CACHE = 'quizofus-economia-2c5a182';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'apple-touch-icon.png', 'favicon-32.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate' || req.destination === 'document') {
    // the page: network first, the saved copy when offline
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); return res; })
      .catch(() => caches.match('index.html').then(r => r || caches.match('./'))));
    return;
  }
  // everything else (icons, manifest): the saved copy first, the network if missing
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })));
});
