// A fonte de sorteios do jogo (mapa, itens, inimigos e ataques dos chefes). Sem semente, é o Math.random de sempre;
// com semente (`?seed=123` na URL, ou startRun(123)), a mesma semente gera o mesmo mapa e os mesmos sorteios na mesma
// ordem, o que reproduz um bug ou uma situação de equilíbrio. Efeitos só visuais e sons NÃO usam esta fonte (não gastam
// a sequência), para que a semente continue valendo ao mudar um brilho.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let source: () => number = Math.random;
let current: number | null = null;

/** Um número em [0, 1), da fonte da partida. */
export function random(): number {
  return source();
}

/** Começa uma partida com semente (ou sem, e então sorteia uma nova para poder repetir depois). Devolve a semente. */
export function startRun(seed?: number | null): number {
  const s = Number.isFinite(seed as number) ? (seed as number) >>> 0 : Math.floor(Math.random() * 0xffffffff);
  current = s;
  source = mulberry32(s);
  return s;
}

/** Volta ao Math.random (testes, páginas de apoio). */
export function clearSeed(): void {
  source = Math.random;
  current = null;
}

export function currentSeed(): number | null {
  return current;
}

/** A semente pedida na URL (`?seed=123`), ou null. */
export function seedFromUrl(search: string): number | null {
  const v = new URLSearchParams(search).get('seed');
  if (v === null || !/^\d{1,10}$/.test(v)) return null;
  return Number(v) >>> 0;
}
