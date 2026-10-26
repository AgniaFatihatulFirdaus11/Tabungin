const CACHE = "tabungin-v4";
const FILES = [
  "./",
  "index.html",
  "app.html",
  "wallet.html",
  "style.css",
  "landing.css",
  "wallet.css",
  "index.js",
  "wallet.js",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-192.png",
  "icon-maskable-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.all(FILES.map(f => cache.add(f).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});