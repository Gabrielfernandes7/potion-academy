// Ícones dos quatro elementos, desenhados em SVG segundo a tabela de símbolos da alquimia
// (sem emojis nem imagens externas). Os elementos são FOGO, AR, ÁGUA e TERRA:
//   FOGO  = triângulo para cima (△)
//   AR    = triângulo para cima com barra horizontal
//   ÁGUA  = triângulo para baixo (▽)
//   TERRA = triângulo para baixo com barra horizontal
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
export const LATIN: Record<ElementId, string> = { fire: 'sulphur', water: 'mercurius', earth: 'sal', air: 'aer' };

const UP = 'M24 6 L8 32 L40 32 Z'; // triângulo para cima
const DOWN = 'M8 16 L40 16 L24 42 Z'; // triângulo para baixo
const BAR_UP = 'M13.5 23 H34.5'; // barra cortando o triângulo de cima (altura ~2/3)
const BAR_DOWN = 'M14 26 H34'; // barra cortando o triângulo de baixo

// Cada ícone: a aquarela (deslocada 1 px, como pintada fora da linha) e depois a tinta.
const PAINT: Record<ElementId, string> = {
  fire: '<g transform="translate(1.2 1)" opacity="0.92"><path d="' + UP + '" fill="#e8a23a" opacity="0.35"/></g>',
  water: '<g transform="translate(1.2 1)" opacity="0.92"><path d="' + DOWN + '" fill="#6fa3c4" opacity="0.35"/></g>',
  earth: '<g transform="translate(1.2 1)" opacity="0.92"><path d="' + DOWN + '" fill="#7aa05a" opacity="0.35"/></g>',
  air: '<g transform="translate(1.2 1)" opacity="0.92"><path d="' + UP + '" fill="#8d84b5" opacity="0.35"/></g>',
};

const LINES: Record<ElementId, string> = {
  fire: `<path d="${UP}"/>`,
  water: `<path d="${DOWN}"/>`,
  earth: `<path d="${DOWN}"/><path d="${BAR_DOWN}"/>`,
  air: `<path d="${UP}"/><path d="${BAR_UP}"/>`,
};

/** O ícone em SVG (texto), do tamanho pedido em px. Cuidado: só strings fixas, sem dados de fora. */
export function elementIconSvg(element: ElementId, size = 32): string {
  return (
    `<svg class="el-icon el-${element}" viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true" focusable="false">` +
    `<g filter="url(#rough)">${PAINT[element]}` +
    `<g fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${LINES[element]}</g></g></svg>`
  );
}
