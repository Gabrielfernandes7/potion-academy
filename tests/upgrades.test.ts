import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { addBombSlot, addFireLevel, blastRadius, canPlace, cloneUpgrades, createUpgrades } from '../src/game/upgrades';

describe('power-ups por poção', () => {
  it('o alcance vale só para a poção escolhida', () => {
    const u = createUpgrades();
    addFireLevel(u, 'normal');
    expect(blastRadius(u, 'normal', 2)).toBe(3);
    expect(blastRadius(u, 'mega', 3)).toBe(3);
  });

  it('o limite de frascos é por poção', () => {
    const u = createUpgrades();
    const active = Array(CONFIG.maxBombs).fill('normal');
    expect(canPlace(u, 'normal', active)).toBe(false);
    expect(canPlace(u, 'remote', active)).toBe(true);
    addBombSlot(u, 'normal');
    expect(canPlace(u, 'normal', active)).toBe(true);
  });

  it('respeita os tetos e a cópia é independente', () => {
    const u = createUpgrades();
    for (let i = 0; i < 20; i++) { addBombSlot(u, 'pierce'); addFireLevel(u, 'pierce'); }
    expect(u.pierce.bombsMax).toBe(CONFIG.maxBombs + CONFIG.maxBombUp);
    expect(u.pierce.fireLevel).toBe(CONFIG.maxFireUp);
    const c = cloneUpgrades(u);
    c.pierce.fireLevel = 0;
    expect(u.pierce.fireLevel).toBe(CONFIG.maxFireUp);
  });
});
