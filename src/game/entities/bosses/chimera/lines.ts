// Falas curtas da Quimera de Mercúrio (legenda sobre ela; como as dos outros chefes, não pausam o jogo).
export type ChimeraLine = 'spit' | 'drops' | 'slide' | 'wave' | 'hurt' | 'furious' | 'defeat';

export const CHIMERA_LINES: Record<ChimeraLine, readonly string[]> = {
  spit: ['Prata fundida!', 'Cuspo azougue.'],
  drops: ['Pingos de prata.', 'Chovem espelhos.'],
  slide: ['Escorro entre os dedos.', 'Aqui... e ali.'],
  wave: ['Maré de mercúrio!', 'Tudo escorre.'],
  hurt: ['Me prende, a terra!', 'Pesa, pesa...'],
  furious: ['Eu fervo!'],
  defeat: ['Volto a ser poça.'],
};

export function pickChimeraLine(kind: ChimeraLine, roll: number = Math.random()): string {
  const list = CHIMERA_LINES[kind];
  return list[Math.min(list.length - 1, Math.floor(roll * list.length))];
}
