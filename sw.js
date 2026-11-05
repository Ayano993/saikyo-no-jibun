// 画面の部品は手元に置いて速く開き、ニュースは毎回取りに行く
const CACHE = 'saikyo-v4';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'quotes.js', 'buddy.js', 'audio.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // 同じサイトの部品とニュースは「まずネット、だめなら手元」
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(e.request).then(r => {
        if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request.url.split('?')[0], copy)); }
        return r;
      }).catch(() => caches.match(e.request.url.split('?')[0]).then(r => r || caches.match('index.html')))
    );
    return;
  }
  // フォントは手元優先
  if (/fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res;
    })));
  }
});
