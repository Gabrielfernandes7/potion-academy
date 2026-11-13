// Ícones dos quatro atributos da alquimia, desenhados por nós em SVG (sem emojis nem imagens externas):
//   FOGO  = Enxofre (sulphur): triângulo com a chama, sobre a cruz.
//   ÁGUA  = Mercúrio (mercurius): o sinal de Mercúrio, com as ondas dentro do círculo.
//   TERRA = Sal (sal): o círculo cortado, com as camadas do solo.
//   ÉTER  = Éter (aether): a quintessência, a estrela de oito pontas dentro do círculo.
// Estilo de manuscrito iluminado: tinta marrom e aquarela levemente fora da linha. A tinta "tremida"
// vem do filtro #rough, que a página precisa declarar uma vez (ver ROUGH_FILTER).
import type { ElementId } from '../config';

const INK = '#3a2814';

// Filtro que deforma de leve o traço, como tinta de pena. A página o coloca num <svg> escondido.
export const ROUGH_FILTER =
  '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
  '<filter id="rough" x="-10%" y="-10%" width="120%" height="120%">' +
  '<feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" result="n"/>' +
  '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G"/>' +
  '</filter></defs></svg>';

// Nome latino, como as legendas dos manuscritos.
export const LATIN: Record<ElementId, string> = { fire: 'sulphur', water: 'mercurius', earth: 'sal', air: 'aether' };

// Cada ícone: a aquarela (deslocada 1 px, como pintada fora da linha) e depois a tinta.
const PAINT: Record<ElementId, string> = {
  fire:
    '<g transform="translate(1.2 1)" opacity="0.92">' +
    '<path d="M24 11 C27 16 31 19 30 25 C29 29 27 30 24 30 C21 30 19 28 19 25 C19 21 22 20 22 16 C23 14 24 12 24 11 Z" fill="#cf4a2a"/>' +
    '<path d="M24 19 C26 22 27 24 26.5 26.5 C26 28.5 25 29 24 29 C23 29 21.8 28 21.8 26 C21.8 24 23.4 22.6 24 19 Z" fill="#f2b33d"/>' +
    '<path d="M24 5 L8 31 L40 31 Z" fill="#e8a23a" opacity="0.28"/></g>',
  water:
    '<g transform="translate(1.2 1)" opacity="0.92">' +
    '<circle cx="24" cy="19" r="8" fill="#6fa3c4"/>' +
    '<path d="M16.5 17 q3.7 -3 7.5 0 t7.5 0 M16.5 21 q3.7 -3 7.5 0 t7.5 0" fill="none" stroke="#e8f2f6" stroke-width="1.5" stroke-linecap="round"/>' +
    '<path d="M16 5 C17 12 31 12 32 5 C28 8 20 8 16 5 Z" fill="#8fb4c8"/></g>',
  earth:
    '<g transform="translate(1.2 1)" opacity="0.92">' +
    '<circle cx="24" cy="24" r="14" fill="#7aa05a"/>' +
    '<path d="M10 24 H38 A14 14 0 0 1 10 24 Z" fill="#5c7f3c"/>' +
    '<path d="M16 29 h6 M26 31 h7 M19 34 h8" stroke="#d9e6bd" stroke-width="1.6" stroke-linecap="round"/></g>',
  air:
    '<g transform="translate(1.2 1)" opacity="0.92">' +
    '<circle cx="24" cy="24" r="16" fill="#c9c4dc"/>' +
    '<path d="M24 8 L27 21 L40 24 L27 27 L24 40 L21 27 L8 24 L21 21 Z" fill="#8d84b5"/>' +
    '<path d="M13 13 L22 22 M35 13 L26 22 M13 35 L22 26 M35 35 L26 26" stroke="#6f66a0" stroke-width="1.4" stroke-linecap="round"/></g>',
};

const LINES: Record<ElementId, string> = {
  fire:
    '<path d="M24 5 L8 31 L40 31 Z"/>' +
    '<path d="M24 11 C27 16 31 19 30 25 C29 29 27 30 24 30 C21 30 19 28 19 25 C19 21 22 20 22 16 C23 14 24 12 24 11 Z"/>' +
    '<path d="M24 31 V44 M18 38 H30"/>',
  water:
    '<circle cx="24" cy="19" r="8"/>' +
    '<path d="M16 5 C17 12 31 12 32 5"/>' +
    '<path d="M24 27 V43 M18 35 H30"/>' +
    '<path d="M16.5 17 q3.7 -3 7.5 0 t7.5 0 M16.5 21 q3.7 -3 7.5 0 t7.5 0" stroke-width="1.2"/>',
  earth:
    '<circle cx="24" cy="24" r="14"/>' +
    '<path d="M7 24 H41"/>' +
    '<path d="M16 29 h6 M26 31 h7 M19 34 h8" stroke-width="1.2"/>',
  air:
    '<circle cx="24" cy="24" r="16"/>' +
    '<path d="M24 8 L27 21 L40 24 L27 27 L24 40 L21 27 L8 24 L21 21 Z"/>' +
    '<path d="M13 13 L22 22 M35 13 L26 22 M13 35 L22 26 M35 35 L26 26" stroke-width="1.1"/>',
};

/** O ícone em SVG (texto), do tamanho pedido em px. Cuidado: só strings fixas, sem dados de fora. */
export function elementIconSvg(element: ElementId, size = 32): string {
  return (
    `<svg class="el-icon el-${element}" viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true" focusable="false">` +
    `<g filter="url(#rough)">${PAINT[element]}` +
    `<g fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${LINES[element]}</g></g></svg>`
  );
}
