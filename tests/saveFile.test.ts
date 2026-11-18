import { beforeEach, describe, expect, it, vi } from 'vitest';

function installLocalStorage(initial: Record<string, string> = {}): void {
  const data = new Map<string, string>(Object.entries(initial));
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => { data.set(k, v); },
    removeItem: (k: string) => { data.delete(k); },
  });
}

async function load() {
  const storage = await import('../src/storage');
  const file = await import('../src/saveFile');
  return { storage, file };
}

describe('exportar e importar o progresso', () => {
  beforeEach(() => { vi.resetModules(); });

  it('exporta o que o jogador tem, em JSON legível', async () => {
    installLocalStorage({ bombroo_owned: '["normal","mega"]', bombroo_stages_completed: '[1,2]', bombroo_stages_schema: '5', bombroo_arena_wins: '["lion"]' });
    const { file } = await load();
    const out = JSON.parse(file.exportSave(new Date('2026-11-18T10:00:00Z')));
    expect(out.jogo).toBe('potion-academy');
    expect(out.salvoEm).toBe('2026-11-18T10:00:00.000Z');
    expect(out.dados.owned).toEqual(['normal', 'mega']);
    expect(out.dados.stages).toEqual([1, 2]);
    expect(out.dados.arena).toEqual(['lion']);
  });

  it('exportar e importar em outro navegador devolve o mesmo progresso', async () => {
    installLocalStorage({ bombroo_owned: '["normal","mega","remote"]', bombroo_stages_completed: '[1,2,5]', bombroo_stages_schema: '5', bombroo_forms: '["water"]', bombroo_arena_wins: '["lion","chimera"]' });
    const first = await load();
    const text = first.file.exportSave();

    vi.resetModules();
    installLocalStorage();
    const second = await load();
    const res = second.file.importSave(text);
    expect(res).toEqual({ ok: true, added: expect.any(Number) });
    expect(second.storage.snapshotSave()).toEqual(first.storage.snapshotSave());
    expect(second.storage.hasBombType('remote')).toBe(true);
    expect(second.storage.isStageCompleted(5)).toBe(true);
  });

  it('importar junta ao progresso atual e não apaga nada', async () => {
    installLocalStorage({ bombroo_owned: '["normal","mega"]', bombroo_stages_completed: '[1,2,3]', bombroo_stages_schema: '5' });
    const { storage, file } = await load();
    const text = JSON.stringify({ jogo: 'potion-academy', formato: 1, dados: { owned: ['normal'], stages: [4, 1], stagesSchema: 5, forms: [], arena: ['lion'] } });
    const res = file.importSave(text);
    expect(res).toEqual({ ok: true, added: 2 }); // a fase 4 e o chefe da Arena
    expect(storage.hasBombType('mega')).toBe(true);
    expect([1, 2, 3, 4].map(n => storage.isStageCompleted(n))).toEqual([true, true, true, true]);
    expect(storage.arenaWins()).toEqual(['lion']);
  });

  it('renumera o progresso de um arquivo com numeração antiga das fases', async () => {
    installLocalStorage();
    const { storage, file } = await load();
    const text = JSON.stringify({ jogo: 'potion-academy', formato: 1, dados: { owned: ['normal'], stages: [1, 2, 3], stagesSchema: 1 } });
    expect(file.importSave(text).ok).toBe(true);
    expect(storage.isStageCompleted(5)).toBe(true); // a antiga 3 agora é a 5
    expect(storage.isStageCompleted(3)).toBe(false);
  });

  it('descarta valores inválidos e mantém a poção de fogo', async () => {
    installLocalStorage();
    const { file } = await load();
    const parsed = file.parseSave(JSON.stringify({ jogo: 'potion-academy', formato: 1, dados: { owned: ['xyz', 7, 'mega'], stages: [1, 'a', -2, 1], stagesSchema: 5, forms: 'x', arena: [3] } }));
    expect(parsed).toEqual({ ok: true, data: { owned: ['mega', 'normal'], stages: [1], forms: [], arena: [] } });
  });

  it('recusa com mensagem clara o que não for um progresso válido', async () => {
    installLocalStorage();
    const { file } = await load();
    const err = (t: string): string => { const r = file.parseSave(t); return r.ok ? '' : r.error; };
    expect(err('{nao e json')).toMatch(/JSON/);
    expect(err('[1,2]')).toMatch(/não é um progresso/);
    expect(err(JSON.stringify({ jogo: 'outro-jogo', formato: 1, dados: {} }))).toMatch(/não é um progresso/);
    expect(err(JSON.stringify({ jogo: 'potion-academy', formato: 1 }))).toMatch(/incompleto/);
    expect(err(JSON.stringify({ jogo: 'potion-academy', formato: 99, dados: {} }))).toMatch(/mais nova/);
    expect(err(JSON.stringify({ jogo: 'potion-academy', formato: 1, dados: { stagesSchema: 99 } }))).toMatch(/mais nova/);
    expect(err('x'.repeat(300_000))).toMatch(/grande demais/);
  });

  it('um arquivo recusado não muda o progresso', async () => {
    installLocalStorage({ bombroo_owned: '["normal"]' });
    const { storage, file } = await load();
    expect(file.importSave('lixo').ok).toBe(false);
    expect(storage.snapshotSave().owned).toEqual(['normal']);
  });
});
