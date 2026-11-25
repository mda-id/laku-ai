/* laku.ai service worker — cache-first untuk aset statis, network-first untuk halaman. */
var CACHE = 'laku-ai-v1';
var ASSETS = [
  './', './index.html', './app/', './app/index.html', './app/manifest.webmanifest',
  './assets/css/fonts.css', './assets/css/app.css', './assets/css/landing.css',
  './assets/js/app.js',
  './assets/fonts/poppins-400.woff2', './assets/fonts/poppins-500.woff2', './assets/fonts/poppins-600.woff2', './assets/fonts/poppins-700.woff2',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/icons/apple-touch-icon.png', './assets/icons/favicon-32.png'
];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(ASSETS.map(function (u) { return c.add(u).catch(function () {}); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(function (res) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, cp); }); return res; }).catch(function () { return caches.match(r).then(function (m) { return m || caches.match('./app/index.html'); }); }));
    return;
  }
  e.respondWith(caches.match(r).then(function (m) {
    return m || fetch(r).then(function (res) { if (res.ok) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, cp); }); } return res; });
  }));
});
