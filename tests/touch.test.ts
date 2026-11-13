import { describe, expect, it } from 'vitest';
import { TouchInput } from '../src/input/touch';

describe('TouchInput', () => {
  it('direção: "acabou de apertar" é consumido uma vez; segurar continua', () => {
    const t = new TouchInput();
    t.press('left');
    expect(t.held.left).toBe(true);
    expect(t.consumeDir('left')).toBe(true);
    expect(t.consumeDir('left')).toBe(false);
    expect(t.held.left).toBe(true);
    t.release('left');
    expect(t.held.left).toBe(false);
  });

  it('ações são pontuais e consumidas uma vez', () => {
    const t = new TouchInput();
    t.press('bomb');
    expect(t.consumeAction('bomb')).toBe(true);
    expect(t.consumeAction('bomb')).toBe(false);
    t.press('pause');
    t.clearJust();
    expect(t.consumeAction('pause')).toBe(false);
  });

  it('atividade acorda a personagem e é consumida na consulta', () => {
    const t = new TouchInput();
    expect(t.consumeActivity()).toBe(false);
    t.press('detonate');
    expect(t.consumeActivity()).toBe(true);
    expect(t.consumeActivity()).toBe(false);
  });

  it('anyHeld e releaseAll', () => {
    const t = new TouchInput();
    t.press('up');
    t.press('right');
    expect(t.anyHeld).toBe(true);
    t.releaseAll();
    expect(t.anyHeld).toBe(false);
  });

  it('toque rápido (dedo sobe antes do frame) ainda vale um passo', () => {
    const t = new TouchInput();
    t.press('right');
    t.release('right');
    expect(t.held.right).toBe(true); // o jogo ainda lê o toque neste frame
    expect(t.consumeDir('right')).toBe(true);
    t.clearJust();
    expect(t.held.right).toBe(false); // solta no fim do frame
  });

  it('tocar de novo cancela a soltura adiada', () => {
    const t = new TouchInput();
    t.press('left');
    t.release('left');
    t.press('left');
    t.clearJust();
    expect(t.held.left).toBe(true);
  });
});
