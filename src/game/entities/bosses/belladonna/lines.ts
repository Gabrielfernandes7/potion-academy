// Falas curtas da Belladona (texto puro, testável). Aparecem como legenda sobre ela,
// sem pausar o jogo nem bloquear a jogadora: são uma camada de personagem, não de regra.
export type BossLine = 'fire' | 'rain' | 'blink' | 'hurt' | 'furious' | 'defeat';

export const BOSS_LINES: Record<BossLine, readonly string[]> = {
  fire: ['Arde!', 'Queima, canguru!'],
  rain: ['Chova, então!', 'Molhe-se!'],
  blink: ['Não me encontra.', 'Procura de novo.'],
  hurt: ['Ainda não!', 'Eu contei quem morreu.'],
  furious: ['Sabe quantos morreram?'],
  defeat: ['Quem alimenta a aldeia?'],
};

// Escolhe uma fala do tipo; `roll` em [0, 1) (padrão: sorteio) torna o teste determinístico.
export function pickBossLine(kind: BossLine, roll: number = Math.random()): string {
  const list = BOSS_LINES[kind];
  return list[Math.min(list.length - 1, Math.floor(roll * list.length))];
}
