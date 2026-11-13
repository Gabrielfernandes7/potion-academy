// Migração do progresso salvo (puro, testável). O progresso guarda NÚMEROS de fase; quando uma
// fase é inserida no meio, os números seguintes mudam e o salvo precisa acompanhar.
//
// Versões da numeração (STAGE_SCHEMA):
//   1: Chamado, Caminho, Escadaria... (sem a Névoa). Também é o que há em quem nunca teve versão salva.
//   2: Chamado, Caminho, Névoa, Escadaria... (a Névoa é a fase 3; as de antes dela não mudam).
//   3: Chamado, Caminho, Névoa, Poço (chefe Quimera), Escadaria... (o Poço é a fase 4).
// Ao inserir uma fase, aumente STAGE_SCHEMA e acrescente o passo em `STEPS`.
export const STAGE_SCHEMA = 3;

type Step = (completed: number[]) => number[];

// STEPS[v] leva a numeração da versão v para a v + 1.
const STEPS: Record<number, Step> = {
  1: completed => completed.map(s => (s >= 3 ? s + 1 : s)), // Névoa entrou como fase 3
  2: completed => completed.map(s => (s >= 4 ? s + 1 : s)), // Poço (chefe do Vale) entrou como fase 4
};

export function migrateCompleted(completed: readonly number[], fromSchema: number): number[] {
  let list = [...completed];
  for (let v = Math.max(1, fromSchema); v < STAGE_SCHEMA; v++) list = STEPS[v](list);
  return [...new Set(list)].sort((a, b) => a - b);
}
