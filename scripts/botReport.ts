// Relatório do bot (issue #5 e #17): para cada fase comum, quanto tempo leva um jogador que segue o plano, quanta
// pressão os inimigos fazem nele e onde a fase pede ajuste. Uso:
//   npm run bot:report            tabela legível
//   npm run bot:report -- --json  o mesmo em JSON (para comparar antes e depois de uma mudança)
// Os números são do bot (tests/helpers/playthroughBot.ts) com a simulação de inimigos (threatSim.ts), 30 sementes.
// O bot NÃO foge dos inimigos: "morre" é o pior caso do plano, não o que um jogador cuidadoso sofre.
import { STAGES } from '../src/game/stages';
import { stageThreat, type StageThreat } from '../tests/helpers/threatSim';

const SEEDS = Array.from({ length: 30 }, (_, i) => 1000 + i * 7919);
const COMMON = STAGES.map((def, i) => ({ def, n: i + 1 })).filter(({ def }) => def.door && !def.boss);

interface Row extends StageThreat { n: number; leitura: string[] }

function reading(t: StageThreat): string[] {
  const out: string[] = [];
  if (t.wins < t.seeds) out.push(`o plano não chega à porta em ${t.seeds - t.wins} semente(s): revisar a grade`);
  if (t.timeWorstTwoMs > t.timeLimitMs * 0.9) out.push('sem folga: o pior caso com dois frascos usa mais de 90% do tempo');
  if (t.hitsOn - t.hitsOff >= 2) out.push(`a perseguição soma ${(t.hitsOn - t.hitsOff).toFixed(1)} toques: tensão para conferir na partida`);
  if (t.deathRateOn >= 0.25) out.push(`o plano sem fuga zeraria a vida em ${Math.round(t.deathRateOn * 100)}% das sementes`);
  if (t.damageOn >= 16) out.push(`dano médio de ${t.damageOn.toFixed(0)} de 24 pontos sem fugir: pouca folga para erro`);
  return out;
}

const rows: Row[] = COMMON.map(({ def, n }) => {
  const t = stageThreat(def, SEEDS);
  return { ...t, n, leitura: reading(t) };
});

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(rows, null, 2));
} else {
  const s = (ms: number) => `${(ms / 1000).toFixed(0)}s`;
  console.log('fase  nome                      tempo (1 frasco | 2 frascos | fase)   toques sem | com   dano com  ameaça  morre');
  for (const r of rows) {
    console.log(
      `${String(r.n).padStart(3)}   ${r.name.padEnd(24)}  ${s(r.timeMedianMs).padStart(6)} | ${s(r.timeWorstTwoMs).padStart(6)} | ${s(r.timeLimitMs).padStart(6)}`
      + `        ${r.hitsOff.toFixed(1).padStart(5)} | ${r.hitsOn.toFixed(1).padEnd(5)}  ${r.damageOn.toFixed(1).padStart(6)}  ${(r.closeMsOn / 1000).toFixed(1).padStart(5)} s  ${String(Math.round(r.deathRateOn * 100)).padStart(3)}%`,
    );
  }
  console.log('\nO que olhar (automático, para decidir a próxima mudança):');
  for (const r of rows) for (const l of r.leitura) console.log(`  fase ${r.n} (${r.name}): ${l}`);
  console.log('\nLegenda: toques = contatos e explosões (proteção de 1,5 s); ameaça = tempo com inimigo a até 2 casas;');
  console.log('morre = fração das sementes em que o plano (sem fugir) zera a vida de 24 pontos.');
}
