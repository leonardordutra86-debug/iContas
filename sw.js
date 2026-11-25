// Troque o número da versão sempre que atualizar o app, para os celulares pegarem a novidade.
const V = 'contas-v4';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  // só cuida do próprio app e dos scripts do Firebase; banco e login passam direto
  if (u.origin !== location.origin && u.hostname !== 'www.gstatic.com') return;

  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r)
        .then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; })
        .catch(() => caches.match(r).then(m => m || caches.match('index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(r).then(m => {
      const net = fetch(r)
        .then(res => { if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; })
        .catch(() => m);
      return m || net;
    })
  );
});
