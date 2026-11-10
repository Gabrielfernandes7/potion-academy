import { beforeEach, describe, expect, it, vi } from 'vitest';

// localStorage fake: o módulo storage.ts lê/grava no carregamento, então
// precisamos preparar o storage antes de importar.
function installLocalStorage(initial: Record<string, string> = {}): void {
  const data = new Map<string, string>(Object.entries(initial));
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => { data.set(k, v); },
    removeItem: (k: string) => { data.delete(k); },
  });
}

describe('storage (chaves de persistência)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('começa com 100 de POÇÃO e só a poção de fogo', async () => {
    installLocalStorage();
    const s = await import('../src/storage');
    expect(s.Bank.get()).toBe(100);
    expect(s.hasBombType('normal')).toBe(true);
    expect(s.hasBombType('mega')).toBe(false);
  });

  it('compra desconta o saldo e marca a poção como possuída', async () => {
    installLocalStorage();
    const s = await import('../src/storage');
    expect(s.buyBombType('mega')).toBe(true);
    expect(s.Bank.get()).toBe(40);
    expect(s.hasBombType('mega')).toBe(true);
    expect(s.buyBombType('mega')).toBe(false); // já comprada
  });

  it('não compra sem saldo suficiente', async () => {
    installLocalStorage({ bombroo_bank: '50' });
    const s = await import('../src/storage');
    expect(s.buyBombType('pierce')).toBe(false); // custa 90
    expect(s.Bank.get()).toBe(50);
  });

  it('lê o progresso salvo com as chaves originais', async () => {
    installLocalStorage({ bombroo_bank: '250', bombroo_owned: '["normal","remote"]' });
    const s = await import('../src/storage');
    expect(s.Bank.get()).toBe(250);
    expect(s.hasBombType('remote')).toBe(true);
  });
});
