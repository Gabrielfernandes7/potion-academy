// Regra de camadas (docs/25-arquitetura-para-agentes.md). A lógica do jogo (src/game) não importa Phaser nem
// cenas/telas em tempo de execução, exceto nos arquivos "de ligação" listados abaixo. Os imports de tipo não contam.
// As listas são a linha de base do que já existe: um arquivo novo que quebre a regra falha aqui; quando uma exceção
// deixa de ser necessária, este teste também falha, para a lista só encolher.
import { describe, expect, it } from 'vitest';

const sources = import.meta.glob<string>('/src/**/*.ts', { query: '?raw', import: 'default', eager: true });
const isGame = (f: string) => f.startsWith('/src/game/') && !f.endsWith('.test.ts');

// imports de valor (não `import type`), com o caminho do módulo
function valueImports(src: string): string[] {
  const out: string[] = [];
  const re = /^import\s+(?!type\s)[^;]*?from\s+['"]([^'"]+)['"]|^import\s+['"]([^'"]+)['"]/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) out.push(m[1] ?? m[2]);
  return out;
}

// caminho relativo -> caminho absoluto dentro de src/
function resolve(from: string, spec: string): string | null {
  if (spec === 'phaser') return 'phaser';
  if (!spec.startsWith('.')) return null;
  const parts = from.split('/').slice(0, -1);
  for (const seg of spec.split('/')) {
    if (seg === '.' || seg === '') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return parts.join('/');
}

// Arquivos que ligam a lógica ao Phaser (desenham, animam, reagem a eventos). Podem importar Phaser.
const PHASER_ADAPTERS = new Set([
  '/src/game/BombSystem.ts',
  '/src/game/effects/Fog.ts',
  '/src/game/entities/bosses/belladonna/BelladonnaController.ts',
  '/src/game/entities/bosses/BossBase.ts',
  '/src/game/entities/enemies/EnemySystem.ts',
  '/src/game/entities/hitEffects.ts',
  '/src/game/fx/objectPool.ts',
  '/src/game/fx/particlePool.ts',
  '/src/game/launcher.ts',
  '/src/game/PickupSystem.ts',
  '/src/game/RooFormSystem.ts',
  '/src/game/types.ts', // importa tipos de Phaser em valor: candidato a `import type`
]);

// Dependências de cena/tela que a lógica já tem. Não crescem: ao remover uma, tire da lista.
const SCENE_UI_BASELINE = new Set([
  '/src/game/entities/bosses/BossBase.ts', // ui/theme (cores)
  '/src/game/launcher.ts', // cenas e telas de DOM: a ponte de navegação
  '/src/game/PlayerController.ts', // ui/haptics
  '/src/game/RooFormSystem.ts', // ui/abilityButton
  '/src/game/StoryDirector.ts', // ui/dialogue e ui/stageIntro
]);

function offenders(pred: (imports: string[]) => boolean): string[] {
  return Object.keys(sources).filter(f => isGame(f) && pred(valueImports(sources[f]).map(s => resolve(f, s) ?? '')));
}

describe('arquitetura: camadas de src/game', () => {
  it('só os arquivos de ligação importam Phaser', () => {
    const bad = offenders(imps => imps.includes('phaser'));
    const novos = bad.filter(f => !PHASER_ADAPTERS.has(f));
    expect(novos, 'lógica pura não importa Phaser: mova a regra para arquivo puro ou registre a ligação').toEqual([]);
  });

  it('a lista de ligações não tem entradas obsoletas', () => {
    const bad = new Set(offenders(imps => imps.includes('phaser')));
    const sobra = [...PHASER_ADAPTERS].filter(f => !bad.has(f));
    expect(sobra).toEqual([]);
  });

  it('src/game não importa cenas nem telas (ui/) além da linha de base', () => {
    const bad = offenders(imps => imps.some(p => /\/src\/(scenes|ui)\//.test(p) || /^\/src\/(scenes|ui)\//.test(p)));
    const novos = bad.filter(f => !SCENE_UI_BASELINE.has(f));
    expect(novos, 'nova dependência de cena/tela em src/game: use um evento, um registro ou injeção').toEqual([]);
  });

  it('a linha de base de cena/tela não tem entradas obsoletas', () => {
    const bad = new Set(offenders(imps => imps.some(p => /^\/src\/(scenes|ui)\//.test(p))));
    expect([...SCENE_UI_BASELINE].filter(f => !bad.has(f))).toEqual([]);
  });
});
