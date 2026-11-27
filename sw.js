/* Flight Command Practice: offline support.
   Pages: try the network first (so updates always arrive), fall back to the saved copy when offline.
   Other files from this site and the fonts: saved on first use. */
var CACHE = 'fc-offline-v1';
var CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-180.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function fontHost(u) { return u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com'; }
self.addEventListener('fetch', function (e) {
  var req = e.request; if (req.method !== 'GET') return;
  var u = new URL(req.url);
  if (req.mode === 'navigate' && u.origin === location.origin) {
    e.respondWith(fetch(req).then(function (r) {
      if (r && r.ok) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put('index.html', cp); }); }
      return r;
    }).catch(function () { return caches.match('index.html').then(function (m) { return m || caches.match('./'); }); }));
    return;
  }
  if (u.origin === location.origin || fontHost(u)) {
    e.respondWith(caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (r) {
        if (r && (r.ok || r.type === 'opaque')) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); }); }
        return r;
      }).catch(function () { return hit; });
      return hit || net;
    }));
  }
});
