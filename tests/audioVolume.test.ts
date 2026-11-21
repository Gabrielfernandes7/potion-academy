import { describe, expect, it } from 'vitest';
import { clampVolume } from '../src/audio/prefs';
import { audio } from '../src/audio/AudioEngine';
import { FakeContext } from './helpers/fakeAudio';

describe('volume', () => {
  it('fica entre 0 e 1; valor estranho vira o padrão', () => {
    expect(clampVolume(0.4)).toBe(0.4);
    expect(clampVolume(7)).toBe(1);
    expect(clampVolume(-1)).toBe(0);
    expect(clampVolume('alto')).toBe(1);
    expect(clampVolume(NaN, 0.5)).toBe(0.5);
  });
  it('o motor aceita mudar o volume com e sem contexto', () => {
    expect(() => audio.setSfxVolume(0.3)).not.toThrow();
    audio.attachContext(new FakeContext() as unknown as AudioContext);
    expect(() => { audio.setSfxVolume(0); audio.setMusicVolume(0.5); }).not.toThrow();
  });
});
