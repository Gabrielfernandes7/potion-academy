// Falas curtas do Ouroboros (legenda sobre ele; como as dos outros chefes, não pausam o jogo).
export type OuroborosLine = 'ring' | 'bite' | 'cycle' | 'turn' | 'hurt' | 'furious' | 'defeat';

export const OUROBOROS_LINES: Record<OuroborosLine, readonly string[]> = {
  ring: ['O fim é o começo.', 'Volte ao ponto de onde partiu.'],
  bite: ['Mordo o que sou.', 'Tudo volta à boca.'],
  cycle: ['O ciclo se fecha.', 'Gire comigo.'],
  turn: ['A roda gira.', 'Agora é outra a lição.'],
  hurt: ['Cortar o ciclo dói.', 'Ainda sou inteiro.'],
  furious: ['O céu gira mais depressa!'],
  defeat: ['O ciclo... se abre.'],
};

export function pickOuroborosLine(kind: OuroborosLine, roll: number = Math.random()): string {
  const list = OUROBOROS_LINES[kind];
  return list[Math.min(list.length - 1, Math.floor(roll * list.length))];
}
