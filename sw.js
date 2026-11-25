// O app se atualiza sozinho: não precisa mais trocar este número a cada versão.
const V = 'contas-v6';
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
  if (r.method !== 'GET' || r.cache === 'no-store') return; // verificação de versão vai direto à internet
  // só cuida do próprio app e dos scripts do Firebase; banco e login passam direto
  if (u.origin !== location.origin && u.hostname !== 'www.gstatic.com') return;

  // Páginas: sempre tenta a versão mais nova primeiro; sem internet, usa a guardada
  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r.url, { cache: 'no-cache' })
        .then(res => {
          if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; }
          // página com erro (ex.: falha do GitHub): usa a cópia guardada, se houver
          return caches.match(r).then(m => m || res);
        })
        .catch(() => caches.match(r).then(m => m || caches.match('index.html')))
    );
    return;
  }

  // Demais arquivos: usa o guardado e atualiza em segundo plano
  e.respondWith(
    caches.match(r).then(m => {
      const net = fetch(r)
        .then(res => { if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; })
        .catch(() => m);
      return m || net;
    })
  );
});
