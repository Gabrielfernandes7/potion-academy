// Desenho sonoro: quais sons tocam para cada evento do jogo e como cada um soa.
// Usa as primitivas de synth.ts. Calmo por regra: senoides e triângulos, ataques lentos.
//
// Cada elemento tem uma "assinatura" sonora que lembra o que ele é (inspirada em fenômenos reais):
//   fogo  (enxofre queimando): rugido que cai, baque grave e estalos de brasa
//   água  (mercúrio líquido):   chiado que sobe e gotas pesadas em sequência
//   terra (sal):                baque seco, cristais crepitando e um ronco baixo
//   ar  (gás luminoso):       vento que cresce devagar e um brilho no fim
import type { ElementId } from '../config';
import { breath, crackle, grain, voice, type Graph } from './synth';

export type SfxName =
  | 'bomb' | 'explosion' | 'pickup' | 'powerup' | 'hurt' | 'door' | 'fizzle'
  | 'transform' | 'formEnd' | 'flame' | 'bubble' | 'pop' | 'wall' | 'gust' | 'root'; // transformações da Roo (variante = o elemento da forma)

// Som da explosão de uma poção, conforme o elemento.
function elementSound(g: Graph, element: ElementId, t: number): void {
  switch (element) {
    case 'fire':
      breath(g, t, 0.9, 0.08, 1600, 260, 0.3);
      voice(g, 72, t, 0.6, { gain: 0.09, type: 'sine', attack: 0.004, glideTo: 36, glideTime: 0.5, send: 0.2 });
      crackle(g, t + 0.05, 16, 0.6, 3000, 0.05);
      break;
    case 'water':
      breath(g, t, 0.6, 0.05, 420, 2400, 0.3);
      [0.08, 0.17, 0.27, 0.38, 0.5, 0.6].forEach((d, i) => {
        const f = 300 + i * 70 + Math.random() * 40;
        voice(g, f, t + d, 0.12, { gain: 0.05 * (1 - i * 0.08), type: 'sine', attack: 0.002, glideTo: f * 2.2, glideTime: 0.08, send: 0.3 });
      });
      break;
    case 'earth':
      voice(g, 58, t, 0.5, { gain: 0.12, type: 'sine', attack: 0.003, glideTo: 34, glideTime: 0.3 });
      crackle(g, t + 0.02, 10, 0.25, 1800, 0.05);
      grain(g, t, 0.35, 0.05, 'highpass', 3000, 0.7, 0.1);
      breath(g, t, 0.5, 0.04, 500, 180, 0.1);
      break;
    case 'air':
      breath(g, t, 1.5, 0.05, 300, 2800, 0.8);
      voice(g, 880, t + 0.5, 0.8, { gain: 0.012, type: 'sine', attack: 0.3, send: 0.8 });
      voice(g, 1320, t + 0.6, 0.8, { gain: 0.008, type: 'sine', attack: 0.3, send: 0.8 });
      break;
  }
}

// Transformação da Roo: cada forma tem o seu som, subindo (a energia se junta) e abrindo num acorde.
//   fogo : rugido que cresce, estalos de brasa e um acorde quente (sol, si, ré)
//   água : borbulhar que sobe, gotas em escala e um acorde claro (mi, lá, si)
function transformSound(g: Graph, element: ElementId, t: number): void {
  if (element === 'earth') {
    // terra: um estrondo grave que assenta, cascalho caindo e um acorde de pedra (ré, lá, ré)
    breath(g, t, 0.8, 0.07, 140, 900, 0.2);
    voice(g, 55, t, 1.0, { gain: 0.1, type: 'sine', attack: 0.04, glideTo: 82, glideTime: 0.6, send: 0.2 });
    crackle(g, t + 0.1, 14, 0.7, 1800, 0.05);
    [147, 220, 294].forEach((f, i) => voice(g, f, t + 0.55 + i * 0.06, 1.2, { gain: 0.032, type: 'triangle', attack: 0.07, send: 0.6 }));
    return;
  }
  if (element === 'air') {
    // ar: um vento que sobe, sinos leves e um acorde aberto (lá, mi, si)
    breath(g, t, 1.0, 0.06, 500, 4200, 0.6);
    [0, 0.12, 0.24, 0.38].forEach((d, i) => voice(g, 880 * Math.pow(1.26, i), t + d, 0.5, { gain: 0.022, type: 'sine', attack: 0.01, send: 0.8 }));
    [440, 659, 988].forEach((f, i) => voice(g, f, t + 0.55 + i * 0.05, 1.2, { gain: 0.028, type: 'sine', attack: 0.09, send: 0.75 }));
    return;
  }
  if (element === 'water') {
    breath(g, t, 0.9, 0.06, 300, 3000, 0.5);
    [0, 0.1, 0.2, 0.32, 0.45, 0.6].forEach((d, i) => {
      const f = 330 * Math.pow(1.19, i);
      voice(g, f, t + d, 0.2, { gain: 0.04, type: 'sine', attack: 0.003, glideTo: f * 1.9, glideTime: 0.09, send: 0.5 });
    });
    [330, 440, 494].forEach((f, i) => voice(g, f, t + 0.55 + i * 0.05, 1.1, { gain: 0.03, type: 'triangle', attack: 0.08, send: 0.7 }));
    return;
  }
  breath(g, t, 0.9, 0.08, 250, 2800, 0.3);
  voice(g, 98, t, 0.9, { gain: 0.08, type: 'triangle', attack: 0.05, glideTo: 392, glideTime: 0.8, send: 0.3 });
  crackle(g, t + 0.15, 22, 0.8, 3200, 0.05);
  [392, 494, 587].forEach((f, i) => voice(g, f, t + 0.6 + i * 0.05, 1.1, { gain: 0.032, type: 'triangle', attack: 0.06, send: 0.6 }));
}

// Toca um efeito no instante `t`. variant: elemento da poção ou da forma (muda o timbre).
export function playSfx(g: Graph, name: SfxName, t: number, variant?: ElementId): void {
  switch (name) {
    case 'bomb':
      // poção pousando: uma gota/bolha suave
      voice(g, 420, t, 0.3, { gain: 0.04, glideTo: 640, glideTime: 0.12, send: 0.4 });
      voice(g, 560, t + 0.08, 0.26, { gain: 0.022, glideTo: 780, glideTime: 0.1, send: 0.4 });
      break;
    case 'explosion':
      elementSound(g, variant ?? 'fire', t);
      break;
    case 'fizzle':
      // poção de fogo apagada pela água: chiado de vapor que some + uma gota
      breath(g, t, 0.7, 0.06, 3200, 500, 0.4);
      voice(g, 420, t + 0.05, 0.18, { gain: 0.04, type: 'sine', attack: 0.003, glideTo: 180, glideTime: 0.15, send: 0.4 });
      break;
    case 'pickup':
      // sininho
      voice(g, 784, t, 0.55, { gain: 0.034, attack: 0.008, send: 0.5 });
      voice(g, 1175, t + 0.06, 0.65, { gain: 0.02, attack: 0.008, send: 0.5 });
      break;
    case 'powerup':
      // arpejo ascendente, delicado
      [523, 659, 784, 1047].forEach((f, i) => {
        voice(g, f, t + i * 0.085, 0.7, { gain: 0.032, type: i % 2 ? 'triangle' : 'sine', attack: 0.012, send: 0.55 });
      });
      break;
    case 'hurt':
      // batida grave e abafada (sem aspereza)
      voice(g, 150, t, 0.34, { gain: 0.06, glideTo: 92, glideTime: 0.3, send: 0.15 });
      breath(g, t, 0.2, 0.012, 500, 200, 0.1);
      break;
    case 'transform':
      transformSound(g, variant ?? 'fire', t);
      break;
    case 'formEnd':
      // a forma se desfaz: o mesmo timbre, descendo e se apagando
      if (variant === 'earth') {
        voice(g, 110, t, 0.9, { gain: 0.06, type: 'sine', attack: 0.01, glideTo: 45, glideTime: 0.8, send: 0.2 });
        crackle(g, t, 8, 0.6, 1400, 0.035);
      } else if (variant === 'air') {
        breath(g, t, 0.9, 0.04, 3600, 400, 0.6);
        voice(g, 880, t, 0.6, { gain: 0.02, type: 'sine', attack: 0.01, glideTo: 440, glideTime: 0.5, send: 0.8 });
      } else if (variant === 'water') {
        breath(g, t, 0.8, 0.04, 2200, 300, 0.5);
        [0, 0.12, 0.26, 0.42].forEach((d, i) => voice(g, 700 - i * 110, t + d, 0.22, { gain: 0.03, type: 'sine', attack: 0.004, glideTo: 380 - i * 40, glideTime: 0.14, send: 0.5 }));
      } else {
        breath(g, t, 0.9, 0.05, 1800, 240, 0.4);
        voice(g, 220, t, 0.8, { gain: 0.05, type: 'triangle', attack: 0.01, glideTo: 70, glideTime: 0.7, send: 0.3 });
      }
      break;
    case 'flame':
      // Labareda: um sopro de fogo curto e quente, com estalos
      breath(g, t, 0.5, 0.09, 2800, 500, 0.3);
      voice(g, 190, t, 0.4, { gain: 0.07, type: 'triangle', attack: 0.004, glideTo: 70, glideTime: 0.35, send: 0.25 });
      crackle(g, t + 0.03, 10, 0.4, 3400, 0.045);
      break;
    case 'bubble':
      // bolha de sabão soprada: um sopro suave e um "plim" que sobe
      breath(g, t, 0.35, 0.03, 700, 2600, 0.5);
      voice(g, 520, t + 0.05, 0.3, { gain: 0.035, type: 'sine', attack: 0.01, glideTo: 940, glideTime: 0.22, send: 0.6 });
      voice(g, 1040, t + 0.14, 0.4, { gain: 0.016, type: 'sine', attack: 0.01, send: 0.7 });
      break;
    case 'wall':
      // o muro de sal sobe: um tranco grave e cristais estalando
      voice(g, 70, t, 0.35, { gain: 0.09, type: 'sine', attack: 0.004, glideTo: 48, glideTime: 0.25, send: 0.2 });
      crackle(g, t + 0.02, 12, 0.4, 3000, 0.05);
      break;
    case 'root':
      // a Roo afunda na terra: um ronco grave que desliza e cascalho
      breath(g, t, 0.7, 0.07, 120, 700, 0.2);
      voice(g, 90, t, 0.7, { gain: 0.08, type: 'sine', attack: 0.02, glideTo: 50, glideTime: 0.6, send: 0.2 });
      crackle(g, t + 0.05, 10, 0.5, 1500, 0.04);
      break;
    case 'gust':
      // o sopro: uma lufada que passa de um lado a outro
      breath(g, t, 0.55, 0.08, 400, 3800, 0.5);
      voice(g, 330, t, 0.4, { gain: 0.02, type: 'sine', attack: 0.05, glideTo: 660, glideTime: 0.35, send: 0.7 });
      break;
    case 'pop':
      // a bolha estoura: um estalo seco e uma gotinha
      grain(g, t, 0.05, 0.07, 'bandpass', 2600, 2, 0.4);
      voice(g, 1500, t, 0.1, { gain: 0.04, type: 'sine', attack: 0.001, glideTo: 520, glideTime: 0.07, send: 0.5 });
      break;
    case 'door':
      // acorde que "abre" como uma respiração
      [392, 523, 659].forEach((f, i) => {
        voice(g, f, t + i * 0.05, 1.3, { gain: 0.028, attack: 0.16, send: 0.6 });
      });
      break;
  }
}

// Fanfarra de vitória (fim da campanha).
export function winJingle(g: Graph, t: number): void {
  [523, 659, 784, 1047, 784, 1047].forEach((f, i) => {
    voice(g, f, t + i * 0.27, 1.4, { gain: 0.042, attack: 0.012, send: 0.6 });
    voice(g, f * 1.5, t + i * 0.27, 1.0, { gain: 0.012, type: 'triangle', attack: 0.012, send: 0.6 });
  });
}

// Frase descendente, melancólica mas macia (derrota).
export function gameOverJingle(g: Graph, t: number): void {
  [392, 349, 330, 262].forEach((f, i) => {
    voice(g, f, t + i * 0.5, 1.6, { gain: 0.04, attack: 0.05, send: 0.6 });
    voice(g, f / 2, t + i * 0.5, 1.6, { gain: 0.02, type: 'triangle', attack: 0.08, send: 0.4 });
  });
}
