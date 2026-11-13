// Falas curtas da Mandrágora (legenda sobre ela; como as da Belladona, não pausam o jogo).
export type MandrakeLine = 'roots' | 'tide' | 'burrow' | 'shriek' | 'sprouts' | 'hurt' | 'furious' | 'defeat';

export const MANDRAKE_LINES: Record<MandrakeLine, readonly string[]> = {
  roots: ['A terra me obedece.', 'Raízes, subam!'],
  tide: ['Beba, então!', 'Que a maré suba.'],
  burrow: ['Aqui embaixo, escuto.', 'Cave, cave...'],
  shriek: ['AAAAAH!', 'Tape os ouvidos!'],
  sprouts: ['Brotem, minhas filhas.', 'Mais jardim!'],
  hurt: ['Queima!', 'Fogo não, fogo não!'],
  furious: ['Floresci de raiva!'],
  defeat: ['O jardim lembra de você.'],
};

export function pickMandrakeLine(kind: MandrakeLine, roll: number = Math.random()): string {
  const list = MANDRAKE_LINES[kind];
  return list[Math.min(list.length - 1, Math.floor(roll * list.length))];
}
