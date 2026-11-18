// Registra o service worker (public/sw.js) só em produção: em desenvolvimento ele atrapalharia o recarregamento do Vite.
// Para desligar num aparelho: abra o jogo com `?nosw` (e limpe os dados do site).

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  if (new URLSearchParams(location.search).has('nosw')) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then(() => navigator.serviceWorker.ready)
      .then(reg => {
        // o que já foi baixado antes do service worker existir também vai para o cache (para abrir sem conexão)
        const urls = performance.getEntriesByType('resource').map(e => e.name).concat(location.href);
        reg.active?.postMessage({ type: 'warm', urls });
      })
      .catch(() => { /* sem service worker o jogo funciona igual, só não abre offline */ });
  });
}
