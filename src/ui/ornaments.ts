// Ornamentos das seções do manuscrito, em SVG próprio, à moda do Voynich: planta com raiz grande
// (herbária), diagrama circular de astros (astronômica), tinas verdes ligadas por tubos (balneológica),
// vidros de farmácia com ervas (farmacêutica) e estrelas de parágrafo (receitas). Tinta marrom e
// aquarela fora da linha; o traço tremido vem do filtro #rough (ver ROUGH_FILTER em elementIcons.ts).
import type { SecaoId } from '../game/voynich';

const INK = '#3a2814';

const SHAPES: Record<SecaoId, { paint: string; lines: string }> = {
  herbaria: {
    paint:
      '<path d="M44 76 C36 82 34 92 41 96 C45 98 49 95 51 90 C53 95 59 98 63 94 C68 89 62 81 56 76 Z" fill="#b5683a"/>' +
      '<path d="M49 62 C38 60 30 52 30 44 C40 46 47 52 49 62 Z" fill="#6f9a4a"/>' +
      '<path d="M50 50 C60 48 69 40 69 31 C59 34 51 40 50 50 Z" fill="#7aa85a"/>' +
      '<circle cx="50" cy="20" r="5" fill="#5f8fc4"/><circle cx="43" cy="24" r="4.5" fill="#5f8fc4"/><circle cx="57" cy="24" r="4.5" fill="#5f8fc4"/>' +
      '<circle cx="50" cy="25" r="3.4" fill="#e6b84a"/>',
    lines:
      '<path d="M44 76 C36 82 34 92 41 96 C45 98 49 95 51 90 C53 95 59 98 63 94 C68 89 62 81 56 76 Z"/>' +
      '<path d="M50 76 C50 62 46 50 50 28"/>' +
      '<path d="M49 62 C38 60 30 52 30 44 C40 46 47 52 49 62 Z"/><path d="M50 50 C60 48 69 40 69 31 C59 34 51 40 50 50 Z"/>' +
      '<circle cx="50" cy="20" r="5"/><circle cx="43" cy="24" r="4.5"/><circle cx="57" cy="24" r="4.5"/><circle cx="50" cy="25" r="3.4"/>' +
      '<path d="M44 80 l-6 4 M56 80 l7 3 M48 92 l-2 5" stroke-width="1.1"/>',
  },
  astronomica: {
    paint:
      '<circle cx="50" cy="16" r="6" fill="#e6b84a"/>' +
      '<path d="M84 44 A9 9 0 1 0 84 60 A6.5 6.5 0 1 1 84 44 Z" fill="#8fb4c8"/>' +
      '<path d="M16 44 L18.5 49 L24 50 L20 54 L21 60 L16 57 L11 60 L12 54 L8 50 L13.5 49 Z" fill="#d9a21b"/>' +
      '<path d="M50 38 L53 47 L62 50 L53 53 L50 62 L47 53 L38 50 L47 47 Z" fill="#c0392b"/>',
    lines:
      '<circle cx="50" cy="50" r="45"/><circle cx="50" cy="50" r="33"/><circle cx="50" cy="50" r="19"/>' +
      '<path d="M50 5 V17 M50 83 V95 M5 50 H17 M83 50 H95 M18 18 l9 9 M82 18 l-9 9 M18 82 l9 -9 M82 82 l-9 -9" stroke-width="1.1"/>' +
      '<circle cx="50" cy="16" r="6"/><path d="M50 7 v-3 M50 25 v3 M41 16 h-3 M59 16 h3" stroke-width="1.1"/>' +
      '<path d="M84 44 A9 9 0 1 0 84 60 A6.5 6.5 0 1 1 84 44 Z"/>' +
      '<path d="M16 44 L18.5 49 L24 50 L20 54 L21 60 L16 57 L11 60 L12 54 L8 50 L13.5 49 Z"/>' +
      '<path d="M50 38 L53 47 L62 50 L53 53 L50 62 L47 53 L38 50 L47 47 Z"/>' +
      '<circle cx="50" cy="84" r="1.6"/><circle cx="29" cy="30" r="1.6"/><circle cx="71" cy="70" r="1.6"/>',
  },
  balneologica: {
    paint:
      '<path d="M12 62 H48 V84 C48 90 12 90 12 84 Z" fill="#6aa592"/><ellipse cx="30" cy="62" rx="18" ry="6" fill="#4f8f7c"/>' +
      '<path d="M58 40 H88 V58 C88 63 58 63 58 58 Z" fill="#6aa592"/><ellipse cx="73" cy="40" rx="15" ry="5" fill="#4f8f7c"/>' +
      '<path d="M42 60 C54 58 58 52 62 46" fill="none" stroke="#8fb4c8" stroke-width="4.5" stroke-linecap="round"/>',
    lines:
      '<path d="M12 62 V84 C12 90 48 90 48 84 V62"/><ellipse cx="30" cy="62" rx="18" ry="6"/>' +
      '<path d="M58 40 V58 C58 63 88 63 88 58 V40"/><ellipse cx="73" cy="40" rx="15" ry="5"/>' +
      '<path d="M42 59 C54 57 57 51 61 45 M44 63 C56 61 60 55 64 49" stroke-width="1.2"/>' +
      '<path d="M20 74 q4 -3 8 0 t8 0 M64 52 q3 -2 6 0 t6 0" stroke-width="1.1"/>',
  },
  farmaceutica: {
    paint:
      '<path d="M20 40 H46 V46 C42 51 42 66 46 71 V78 H20 V71 C24 66 24 51 20 46 Z" fill="#c0523a"/>' +
      '<path d="M58 50 H78 V55 C75 59 75 70 78 74 V80 H58 V74 C61 70 61 59 58 55 Z" fill="#d9a21b"/>' +
      '<path d="M33 40 C28 30 24 28 22 22 C30 22 34 28 33 40 Z" fill="#6f9a4a"/><path d="M35 38 C40 30 44 28 48 24 C42 22 36 28 35 38 Z" fill="#7aa85a"/>',
    lines:
      '<path d="M20 40 H46 V46 C42 51 42 66 46 71 V78 H20 V71 C24 66 24 51 20 46 Z"/>' +
      '<path d="M58 50 H78 V55 C75 59 75 70 78 74 V80 H58 V74 C61 70 61 59 58 55 Z"/>' +
      '<path d="M22 56 H44 M22 60 H44" stroke-width="1.1"/><path d="M60 62 H76" stroke-width="1.1"/>' +
      '<path d="M33 40 C28 30 24 28 22 22 C30 22 34 28 33 40 Z"/><path d="M35 38 C40 30 44 28 48 24 C42 22 36 28 35 38 Z"/>',
  },
  receitas: {
    paint:
      '<path d="M18 22 L20.5 28 L27 29 L22 33 L23.5 40 L18 36.5 L12.5 40 L14 33 L9 29 L15.5 28 Z" fill="#c0392b"/>' +
      '<path d="M18 62 L20.5 68 L27 69 L22 73 L23.5 80 L18 76.5 L12.5 80 L14 73 L9 69 L15.5 68 Z" fill="#5f8fc4"/>',
    lines:
      '<path d="M18 22 L20.5 28 L27 29 L22 33 L23.5 40 L18 36.5 L12.5 40 L14 33 L9 29 L15.5 28 Z"/>' +
      '<path d="M18 62 L20.5 68 L27 69 L22 73 L23.5 80 L18 76.5 L12.5 80 L14 73 L9 69 L15.5 68 Z"/>' +
      '<path d="M34 26 q4 -3 8 0 t8 0 t8 0 t8 0 t8 0 M34 33 q4 -3 8 0 t8 0 t8 0 t8 0 M34 40 q4 -3 8 0 t8 0 t8 0 t8 0 t8 0" stroke-width="1.2"/>' +
      '<path d="M34 66 q4 -3 8 0 t8 0 t8 0 t8 0 M34 73 q4 -3 8 0 t8 0 t8 0 t8 0 t8 0 M34 80 q4 -3 8 0 t8 0 t8 0" stroke-width="1.2"/>',
  },
};

/** Ornamento da seção, em SVG (texto), do tamanho pedido em px. Só strings fixas. */
export function ornamentSvg(secao: SecaoId, size = 96): string {
  const s = SHAPES[secao];
  return (
    `<svg class="ornamento orn-${secao}" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true" focusable="false">` +
    `<g filter="url(#rough)"><g opacity="0.9" transform="translate(1.2 1)">${s.paint}</g>` +
    `<g fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${s.lines}</g></g></svg>`
  );
}

/** Estrela de parágrafo, como a que abre cada receita do manuscrito. */
export function starBullet(size = 14): string {
  return (
    `<svg class="estrela" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" focusable="false">` +
    `<g filter="url(#rough)"><path d="M12 2 L14.6 9 L22 9.6 L16.3 14.4 L18.2 22 L12 17.8 L5.8 22 L7.7 14.4 L2 9.6 L9.4 9 Z" fill="#c0392b" opacity="0.85"/>` +
    `<path d="M12 2 L14.6 9 L22 9.6 L16.3 14.4 L18.2 22 L12 17.8 L5.8 22 L7.7 14.4 L2 9.6 L9.4 9 Z" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/></g></svg>`
  );
}
