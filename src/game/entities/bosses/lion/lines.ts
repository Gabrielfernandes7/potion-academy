// Falas curtas do Leão Verde (legenda sobre ele; como as dos outros chefes, não pausam o jogo).
export type LionLine = 'pounce' | 'dissolve' | 'roar' | 'hurt' | 'furious' | 'defeat';

export const LION_LINES: Record<LionLine, readonly string[]> = {
  pounce: ['Bote!', 'Sinto o seu cheiro.'],
  dissolve: ['Tudo se dissolve.', 'Verde que consome.'],
  roar: ['RAAAAR!', 'Escute a biblioteca.'],
  hurt: ['Que luz é essa?', 'O éter queima!'],
  furious: ['Devoro o sol!'],
  defeat: ['Os livros esperam.'],
};

export function pickLionLine(kind: LionLine, roll: number = Math.random()): string {
  const list = LION_LINES[kind];
  return list[Math.min(list.length - 1, Math.floor(roll * list.length))];
}
