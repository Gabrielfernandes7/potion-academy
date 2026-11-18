// O navegador suspende o áudio (troca de aba, economia de energia, ligação) e só o libera com um gesto.
// O motor tem de pedir a retomada também quando só os EFEITOS estão ligados (a música desligada), e não deve
// enfileirar efeitos num contexto suspenso. Era uma das causas possíveis do relato "o som não toca".
import { beforeEach, describe, expect, it } from 'vitest';
import { audio } from '../src/audio/AudioEngine';
import { FakeContext } from './helpers/fakeAudio';

function fresh(state: 'running' | 'suspended'): FakeContext {
  const ctx = new FakeContext();
  ctx.state = state;
  audio.attachContext(ctx as unknown as AudioContext);
  return ctx;
}

describe('áudio: retomada do contexto', () => {
  beforeEach(() => {
    audio.stop();
    audio.sfx = false;
    audio.enabled = false;
  });

  it('só os efeitos ligados: voltar do suspenso retoma o contexto', () => {
    const ctx = fresh('suspended');
    audio.sfx = true;
    audio.resumeIfNeeded();
    expect(ctx.resumeCalls).toBe(1);
    expect(ctx.state).toBe('running');
  });

  it('sem música e sem efeitos, não mexe no contexto', () => {
    const ctx = fresh('suspended');
    audio.resumeIfNeeded();
    expect(ctx.resumeCalls).toBe(0);
  });

  it('um efeito com o contexto suspenso pede a retomada e não cria nós na fila', () => {
    const ctx = fresh('suspended');
    audio.sfx = true;
    const before = ctx.nodes.length;
    audio.play('bomb');
    expect(ctx.resumeCalls).toBe(1);
    expect(ctx.nodes.length).toBe(before); // nada foi agendado
  });

  it('com o contexto rodando, o efeito toca (cria nós)', () => {
    const ctx = fresh('running');
    audio.sfx = true;
    const before = ctx.nodes.length;
    audio.play('bomb');
    expect(ctx.nodes.length).toBeGreaterThan(before);
    expect(ctx.resumeCalls).toBe(0);
  });

  it('efeitos desligados não tocam nem retomam', () => {
    const ctx = fresh('suspended');
    audio.play('bomb');
    expect(ctx.resumeCalls).toBe(0);
  });

  it('uma retomada recusada não derruba o jogo', () => {
    const ctx = fresh('suspended');
    ctx.resume = () => Promise.reject(new Error('sem gesto'));
    audio.sfx = true;
    expect(() => audio.play('bomb')).not.toThrow();
    expect(() => audio.unlock()).not.toThrow();
  });
});
