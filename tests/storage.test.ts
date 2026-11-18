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

  it('começa só com a poção de fogo', async () => {
    installLocalStorage();
    const s = await import('../src/storage');
    expect(s.hasBombType('normal')).toBe(true);
    expect(s.hasBombType('mega')).toBe(false);
  });

  it('aprender uma poção a torna da Roo, e não duplica', async () => {
    installLocalStorage();
    const s = await import('../src/storage');
    s.grantBombType('mega');
    expect(s.hasBombType('mega')).toBe(true);
    s.grantBombType('mega'); // de novo não duplica
    expect(JSON.parse(localStorage.getItem('bombroo_owned')!).filter((x: string) => x === 'mega')).toHaveLength(1);
  });

  it('concluir a fase em que a poção é aprendida a concede (learning.ts)', async () => {
    installLocalStorage();
    const s = await import('../src/storage');
    expect(s.hasBombType('mega')).toBe(false);
    s.markStageCompleted(1);
    expect(s.hasBombType('mega')).toBe(true);
  });

  it('lê o progresso salvo com as chaves originais', async () => {
    installLocalStorage({ bombroo_owned: '["normal","remote"]' });
    const s = await import('../src/storage');
    expect(s.hasBombType('remote')).toBe(true);
  });
});

describe('storage: migração do progresso das fases', () => {
  beforeEach(() => { vi.resetModules(); });

  it('renumera o progresso antigo uma vez e grava a versão', async () => {
    installLocalStorage({ bombroo_stages_completed: JSON.stringify([1, 2, 3]) });
    const s = await import('../src/storage');
    expect(s.isStageCompleted(1)).toBe(true);
    expect(s.isStageCompleted(3)).toBe(false); // a Névoa (nova) ainda não foi vencida
    expect(s.isStageCompleted(4)).toBe(false); // nem o Poço (chefe do Vale)
    expect(s.isStageCompleted(5)).toBe(true);  // a antiga 3 (Escadaria) agora é a 5
    expect(JSON.parse(localStorage.getItem('bombroo_stages_schema')!)).toBe(5);
  });

  it('com a versão atual não renumera de novo', async () => {
    installLocalStorage({ bombroo_stages_completed: JSON.stringify([1, 2, 3]), bombroo_stages_schema: '5' });
    const s = await import('../src/storage');
    expect(s.isStageCompleted(3)).toBe(true);
    expect(s.isStageCompleted(4)).toBe(false);
  });
});

describe('storage: vitórias na Arena', () => {
  beforeEach(() => { vi.resetModules(); });

  it('começa sem vitórias, guarda cada chefe uma vez e lê de volta', async () => {
    installLocalStorage();
    const s = await import('../src/storage');
    expect(s.arenaWins()).toEqual([]);
    s.markArenaWin('lion');
    s.markArenaWin('lion');
    s.markArenaWin('chimera');
    expect(s.arenaWins()).toEqual(['lion', 'chimera']);
    expect(JSON.parse(localStorage.getItem('bombroo_arena_wins')!)).toEqual(['lion', 'chimera']);
  });
  it('um valor estranho salvo não quebra a leitura, e o progresso antigo não muda', async () => {
    installLocalStorage({ bombroo_arena_wins: '"lixo"' });
    const s = await import('../src/storage');
    expect(s.arenaWins()).toEqual([]);
  });
});

describe('storage (dados inválidos)', () => {
  beforeEach(() => { vi.resetModules(); });

  it('descarta poções desconhecidas, tipos errados e duplicatas', async () => {
    installLocalStorage({ bombroo_owned: JSON.stringify(['mega', 'mega', 'xyz', 7, null]) });
    const s = await import('../src/storage');
    expect(s.hasBombType('normal')).toBe(true);
    expect(s.hasBombType('mega')).toBe(true);
    expect(s.hasBombType('xyz' as never)).toBe(false);
  });

  it('JSON quebrado ou do tipo errado não derruba o jogo', async () => {
    installLocalStorage({ bombroo_owned: '{nao e json', bombroo_stages_completed: '"oi"', bombroo_forms: '42', bombroo_arena_wins: '{"a":1}' });
    const s = await import('../src/storage');
    expect(s.hasBombType('normal')).toBe(true);
    expect(s.isStageCompleted(1)).toBe(false);
    expect(s.arenaWins()).toEqual([]);
    expect(s.knowsForm('fire')).toBe(true);
  });

  it('fases salvas: só inteiros positivos, sem repetir', async () => {
    const { cleanStageList, cleanStrings } = await import('../src/storage');
    expect(cleanStageList([1, 1, 2.5, -3, '4', 5, 99999])).toEqual([1, 5]);
    expect(cleanStrings(['a', 'b', 'a', 3], ['a'])).toEqual(['a']);
  });
});

describe('storage: versão do save e importação sem efeitos colaterais', () => {
  beforeEach(() => { vi.resetModules(); });

  it('importar o módulo não lê nem grava nada', async () => {
    installLocalStorage();
    await import('../src/storage');
    expect(localStorage.getItem('bombroo_save_version')).toBeNull();
    expect(localStorage.getItem('bombroo_stages_schema')).toBeNull();
  });

  it('o primeiro uso carimba a versão do save', async () => {
    installLocalStorage();
    const s = await import('../src/storage');
    s.hasBombType('normal');
    expect(JSON.parse(localStorage.getItem('bombroo_save_version')!)).toBe(s.SAVE_VERSION);
  });

  it('um save de versão mais nova não é rebaixado', async () => {
    installLocalStorage({ bombroo_save_version: '99', bombroo_owned: '["normal","mega"]' });
    const s = await import('../src/storage');
    expect(s.hasBombType('mega')).toBe(true);
    expect(JSON.parse(localStorage.getItem('bombroo_save_version')!)).toBe(99);
  });

  it('resetSaveCache faz ler o localStorage de novo', async () => {
    installLocalStorage();
    const s = await import('../src/storage');
    expect(s.hasBombType('mega')).toBe(false);
    localStorage.setItem('bombroo_owned', '["normal","mega"]');
    s.resetSaveCache();
    expect(s.hasBombType('mega')).toBe(true);
  });
});
