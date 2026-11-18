// Service worker do Potion Academy: deixa o jogo abrir sem conexão depois da primeira visita.
// - /assets/* (arquivos com hash no nome, nunca mudam): primeiro o cache, senão a rede (e guarda).
// - o resto (a página, imagens, ícones): primeiro a rede (para pegar versões novas) e, se estiver sem conexão, o cache.
// - a página manda a lista do que carregou ('warm') quando o service worker passa a controlá-la, para o que foi baixado
//   antes dele existir também ficar guardado.
// Para forçar a limpeza de tudo em todos os aparelhos, aumente CACHE.
const CACHE = 'potion-academy-v1';
// ignoreVary: o servidor responde com `Vary: Origin`, e um pedido de módulo (com Origin) não casaria com o que foi guardado sem ele
const MATCH = { ignoreVary: true };

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('potion-academy-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const sameOrigin = url => new URL(url, self.location.href).origin === self.location.origin;

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || !sameOrigin(req.url)) return;
  const url = new URL(req.url);
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(req, MATCH).then(hit => hit || fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })),
    );
    return;
  }
  event.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, MATCH).then(hit => hit || caches.match(new URL('./', self.location.href).href, MATCH))),
  );
});

self.addEventListener('message', event => {
  if (!event.data || event.data.type !== 'warm' || !Array.isArray(event.data.urls)) return;
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.all(event.data.urls.filter(sameOrigin).map(u => cache.add(u).catch(() => {}))),
    ),
  );
});
