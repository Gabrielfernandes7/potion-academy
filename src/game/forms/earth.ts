// Roo Terra (puro): o perfil, o peso e o Muro de sal. Transforma com T, segurando a poção de terra.
//   Degraus 4 e 3: IMUNE à terra (as flores do mal não a chicoteiam), mas fraca ao ar. Degraus 2 e 1: esfriando,
//   resiste à terra e sem fraqueza. Degrau 0: a Roo normal. Poções de terra +50% no auge.
// O peso: transformada, a Roo anda 20% mais devagar. É o preço de ficar firme.
// Muro de sal (X): levanta três casas de sal à frente (uma ao centro, uma de cada lado) por até 4 s (menos nos
//   degraus baixos). Inimigos comuns não passam, a Roo também não, e ninguém coloca poção em cima. O fantasma
//   atravessa (como atravessa qualquer parede). Não nasce na porta, nem onde há poção, inimigo ou a própria Roo.
//   Custa 2 s da forma, espera 4 s.
// Raiz (C): a Roo afunda no chão e nasce em outro lugar, como a Mandrágora: viaja por baixo da terra (passa sob
//   paredes, caixotes, poções e inimigos) por 0,7 s, invulnerável, e brota na casa livre mais distante de uma linha
//   de 4 casas à frente. Ao brotar, a terra racha nas casas ao redor e fere o que estiver nelas. Custa 2 s da forma,
//   espera 5 s. Só brota em chão livre (sem poção, inimigo, chefe, muro de sal nem a porta fechada).
import { PROFILES } from '../entities/profiles';
import type { DamageProfile } from '../entities/damage';
import type { FormDef, FormStage } from './types';

const FULL: DamageProfile = { element: 'earth', maxHp: PROFILES.roo.maxHp, weak: ['air'], resist: [], immune: ['earth'] };
const COOLING: DamageProfile = { element: 'earth', maxHp: PROFILES.roo.maxHp, weak: [], resist: ['earth'], immune: [] };

export const EARTH_FORM: FormDef = {
  id: 'earth',
  nome: 'Roo Terra',
  element: 'earth',
  profile: (stage: FormStage): DamageProfile => (stage >= 3 ? FULL : stage >= 1 ? COOLING : PROFILES.roo),
  boost: 0.5,
  ability: { id: 'salt', nome: 'Muro de sal', short: 'MURO', costMs: 2000, cooldownMs: 4000, range: 1 },
  ability2: { id: 'root', nome: 'Raiz', short: 'RAIZ', costMs: 2000, cooldownMs: 5000, range: 4 },
};

export const ROOT_MS = 700; // tempo debaixo da terra (a Roo não pode ser machucada nem se mexe)

/**
 * Onde a Roo brota: a casa livre mais distante da linha à frente (até `range` casas). O caminho é por baixo da
 * terra, então só a casa de chegada importa. Devolve null se nenhuma servir.
 */
export function rootTarget(
  from: { x: number; y: number }, dir: { x: number; y: number }, range: number,
  landable: (x: number, y: number) => boolean,
): { x: number; y: number } | null {
  if (dir.x === 0 && dir.y === 0) return null;
  for (let i = range; i >= 1; i--) {
    const x = from.x + dir.x * i;
    const y = from.y + dir.y * i;
    if (landable(x, y)) return { x, y };
  }
  return null;
}

/** As casas que racham quando a Roo brota: as quatro vizinhas livres (a dela não entra). */
export function rootBurstTiles(at: { x: number; y: number }, isOpen: (x: number, y: number) => boolean): Array<{ x: number; y: number }> {
  return [[0, -1], [0, 1], [-1, 0], [1, 0]]
    .map(([dx, dy]) => ({ x: at.x + dx, y: at.y + dy }))
    .filter(t => isOpen(t.x, t.y));
}


/** O peso da terra: quanto o passo demora a mais (1,2 = 20% mais lento). Sem forma, 1. */
export function earthWalkFactor(stage: FormStage): number {
  return stage > 0 ? 1.2 : 1;
}

/** Quanto o muro de sal dura, por degrau (4 s no auge; 0 = sem muro). */
export function saltWallMs(stage: FormStage): number {
  return stage <= 0 ? 0 : 1000 + 750 * stage;
}

/**
 * As casas do muro: a casa à frente de `from` e as duas ao lado dela (uma parede de 3 casas, de lado a lado do
 * corredor). Só entram as livres; se a do centro não for livre, não há muro.
 */
export function saltWallTiles(
  from: { x: number; y: number }, dir: { x: number; y: number },
  isOpen: (x: number, y: number) => boolean,
): Array<{ x: number; y: number }> {
  if (dir.x === 0 && dir.y === 0) return [];
  const cx = from.x + dir.x;
  const cy = from.y + dir.y;
  if (!isOpen(cx, cy)) return [];
  const out = [{ x: cx, y: cy }];
  const px = -dir.y;
  const py = dir.x;
  for (const k of [-1, 1]) if (isOpen(cx + px * k, cy + py * k)) out.push({ x: cx + px * k, y: cy + py * k });
  return out;
}

/** Os muros de sal no chão: casas com validade. Puro: quem chama dá o relógio. */
export class SaltWallField {
  private tiles = new Map<string, number>();

  private key = (x: number, y: number): string => `${x},${y}`;

  /** Levanta o muro nas casas, com a duração do degrau. Sem efeito se o degrau não dá muro. */
  raise(tiles: ReadonlyArray<{ x: number; y: number }>, now: number, stage: FormStage): void {
    const ms = saltWallMs(stage);
    if (ms <= 0) return;
    for (const t of tiles) this.tiles.set(this.key(t.x, t.y), now + ms);
  }

  has(x: number, y: number, now: number): boolean {
    const until = this.tiles.get(this.key(x, y));
    return until !== undefined && until > now;
  }

  /** Remove os vencidos e lista os de pé. */
  active(now: number): Array<{ x: number; y: number; left: number }> {
    const out: Array<{ x: number; y: number; left: number }> = [];
    for (const [k, until] of this.tiles) {
      if (until <= now) { this.tiles.delete(k); continue; }
      const [x, y] = k.split(',').map(Number);
      out.push({ x, y, left: until - now });
    }
    return out;
  }

  clear(): void {
    this.tiles.clear();
  }
}
