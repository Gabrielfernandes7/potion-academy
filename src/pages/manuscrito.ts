// Manuscrito do Alquimista (/manuscrito.html): uma página-carta por personagem, no estilo de um manuscrito
// de alquimista. Os dados vêm de game/manuscrito.ts; os desenhos, das mesmas texturas procedurais do jogo.
import '@fontsource/cinzel/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/400-italic.css';
import '@fontsource/nunito/700.css';
import '../styles/manuscrito.css';
import Phaser from 'phaser';
import { ELEMENTS, ElementId } from '../config';
import { FORM_PREVIEW, bootPage, prepareTextures } from './shared';
import { arenaWins, isStageCompleted } from '../storage';
import { isStageUnlocked } from '../game/stages/mapRules';
import { MANUSCRITO, ManuscritoEntry, GRUPOS, entryById, isEntryOpen, statsOf } from '../game/manuscrito';
import { LATIN, elementIconSvg } from '../ui/elementIcons';
import { SECOES, folioLabel, voynichLines } from '../game/voynich';
import { ornamentSvg, starBullet } from '../ui/ornaments';

const ALL = new URLSearchParams(location.search).has('all'); // ?all abre todas as páginas (para conferir)
const reached = (stage: number): boolean => ALL || isStageUnlocked(stage, isStageCompleted);
const beaten = arenaWins(); // chefes vencidos na Arena também abrem a página
const open = (e: ManuscritoEntry): boolean => ALL || isEntryOpen(e, reached, beaten);

const ELEMENT_ORDER: ElementId[] = ['fire', 'water', 'earth', 'air'];

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

// Ícone SVG do atributo (desenhado por nós em ui/elementIcons.ts; só strings fixas).
function icon(element: ElementId, size: number): HTMLElement {
  const s = el('span', 'ico');
  s.innerHTML = elementIconSvg(element, size);
  return s;
}

// Chip de elemento: o ícone e o nome.
function chip(element: ElementId, extra?: string): HTMLElement {
  const def = ELEMENTS[element];
  const c = el('span', 'chip');
  c.append(icon(element, 26), el('span', undefined, extra ? `${def.name} ${extra}` : def.name));
  return c;
}

function mult(m: number): string {
  if (m === 0) return 'imune';
  return `×${String(m).replace('.', ',')}`;
}

// Desenho do personagem em tela, ampliado sem suavizar; com dois quadros ou mais, ele se mexe.
let timer: number | undefined;
function drawSprite(scene: Phaser.Scene, entry: ManuscritoEntry, locked: boolean): HTMLElement {
  const frames = entry.sprite.frames.map(k => scene.textures.get(k).getSourceImage() as CanvasImageSource & { width: number; height: number });
  const w = frames[0].width * entry.sprite.zoom;
  const h = frames[0].height * entry.sprite.zoom;
  const canvas = el('canvas', locked ? 'sprite fechado' : 'sprite');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  let i = 0;
  const paint = (): void => {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(frames[i % frames.length], 0, 0, w, h);
    i++;
  };
  paint();
  if (frames.length > 1 && !locked) timer = window.setInterval(paint, entry.sprite.ms ?? (entry.id === 'roo' ? 180 : 520));
  return canvas;
}

function page(scene: Phaser.Scene, entry: ManuscritoEntry): HTMLElement {
  const locked = !open(entry);
  const stats = statsOf(entry);
  const root = el('article', `folha grupo-${entry.grupo}${locked ? ' trancada' : ''}`);

  const head = el('header', 'folha-topo');
  if (stats && !locked) {
    const seal = el('div', 'selo');
    seal.append(icon(stats.atributo.elemento, 54));
    seal.title = `${stats.atributo.nome} (${stats.atributo.alquimia})`;
    head.append(seal);
  } else {
    const vazio = el('div', 'selo vazio');
    if (locked) vazio.textContent = '?';
    else vazio.innerHTML = starBullet(34);
    head.append(vazio);
  }
  const titles = el('div');
  titles.append(el('p', 'grupo', GRUPOS[entry.grupo]), el('h2', undefined, locked ? '???' : entry.nome), el('p', 'titulo', locked ? 'Página ainda em branco' : entry.titulo));
  head.append(titles);
  // lado direito da folha, como nos códices: fólio (numerado depois, em outra tinta), seção e o desenho dela
  const side = el('div', 'folha-lado');
  const orn = el('span', 'ornamento-caixa');
  orn.innerHTML = ornamentSvg(entry.secao, 88);
  side.append(el('span', 'folio', folioLabel(MANUSCRITO.indexOf(entry) + 12)), orn, el('span', 'secao', SECOES[entry.secao].nome));
  head.append(side);
  root.append(head);

  const body = el('div', 'folha-corpo');
  const fig = el('figure', 'retrato');
  const medal = el('div', 'medalhao');
  medal.append(drawSprite(scene, entry, locked));
  // legenda em voynichês: como as etiquetas ao lado das plantas do códice, não diz nada
  const eva = el('div', 'eva');
  for (const line of voynichLines(locked ? `selado-${entry.id}` : entry.id, 3, 3)) {
    const p = el('p');
    p.innerHTML = starBullet(11);
    p.append(document.createTextNode(line));
    eva.append(p);
  }
  eva.append(el('small', undefined, 'legenda em escrita ainda não decifrada'));
  fig.append(medal, el('figcaption', undefined, locked ? 'Visto em: ?' : `Visto em: ${entry.visto}`), eva);
  body.append(fig);

  const cards = el('section', 'cartas');
  if (locked) {
    cards.append(el('p', 'em-branco', entry.selado
      ? 'Esta página está selada, como o lugar de onde este chefe vem. Ela só se completa quando você o vencer na Arena de treino.'
      : 'Esta página se completa quando a Roo chegar a este personagem. Siga a jornada, e as anotações aparecem.'));
  } else if (stats) {
    // ATRIBUTO
    const atr = el('div', 'carta');
    const a = el('div', 'atributo');
    const at = el('div');
    at.append(el('b', undefined, `${stats.atributo.nome} · ${stats.atributo.alquimia}`), el('em', undefined, LATIN[stats.atributo.elemento]));
    a.append(icon(stats.atributo.elemento, 46), at);
    atr.append(el('h3', undefined, 'Atributo'), a);
    // VIDA
    const vida = el('div', 'carta');
    const bar = el('div', 'barra');
    bar.append(el('i'));
    vida.append(el('h3', undefined, 'Vida'), bar, el('p', 'valor', `${stats.vida} pontos`));
    // FORÇA
    const forca = el('div', 'carta');
    forca.append(el('h3', undefined, 'Força'));
    const f = el('div', 'chips');
    for (const e of stats.forca.imune) f.append(chip(e, '(imune)'));
    for (const e of stats.forca.resiste) f.append(chip(e, '(resiste)'));
    if (!f.childElementCount) f.append(el('span', 'nada', 'nenhuma resistência'));
    forca.append(f);
    // FRAQUEZA
    const fraq = el('div', 'carta fraqueza');
    fraq.append(el('h3', undefined, 'Fraqueza'));
    const w = el('div', 'chips');
    for (const e of stats.fraqueza) w.append(chip(e, '(+50%)'));
    if (!w.childElementCount) w.append(el('span', 'nada', 'nenhuma'));
    fraq.append(w);
    // DANO RECEBIDO
    const tab = el('div', 'carta larga');
    tab.append(el('h3', undefined, 'Dano que recebe de cada poção'));
    const row = el('div', 'tabela');
    for (const e of ELEMENT_ORDER) {
      const cell = el('div', 'celula');
      const m = stats.recebe[e];
      cell.classList.toggle('mais', m > 1);
      cell.classList.toggle('menos', m < 1);
      cell.append(icon(e, 44), el('span', undefined, ELEMENTS[e].name), el('small', undefined, LATIN[e]), el('em', undefined, mult(m)));
      row.append(cell);
    }
    tab.append(row);
    cards.append(atr, vida, forca, fraq, tab);
  } else {
    cards.append(el('p', 'em-branco', 'Não luta. Aqui não há números: só confiança e cuidado.'));
  }
  body.append(cards);
  root.append(body);

  if (!locked) {
    const skills = el('section', 'habilidades');
    skills.append(el('h3', undefined, 'Habilidades'));
    const list = el('div', 'lista');
    for (const s of entry.habilidades) {
      const card = el('div', 'carta hab');
      card.append(el('h4', undefined, s.nome), el('p', undefined, s.texto));
      list.append(card);
    }
    skills.append(list);
    const note = el('section', 'nota');
    note.append(el('h3', undefined, 'Nota do alquimista'), el('p', undefined, entry.nota));
    root.append(skills, note);
  }
  return root;
}

class ManuscritoScene extends Phaser.Scene {
  private current = MANUSCRITO[0].id;

  constructor() {
    super('Manuscrito');
  }

  create(): void {
    prepareTextures(this, { forms: FORM_PREVIEW, roughFilter: true }); // formas da Roo e o filtro de tinta dos ícones
    const wanted = new URLSearchParams(location.search).get('p') ?? location.hash.slice(1);
    if (wanted && entryById(wanted)) this.current = wanted;
    this.buildTabs();
    this.show(this.current);
    window.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') this.step(1);
      else if (e.key === 'ArrowLeft') this.step(-1);
    });
  }

  private step(d: number): void {
    const i = MANUSCRITO.findIndex(e => e.id === this.current);
    this.show(MANUSCRITO[(i + d + MANUSCRITO.length) % MANUSCRITO.length].id);
  }

  private buildTabs(): void {
    const nav = document.getElementById('abas') as HTMLElement;
    nav.textContent = '';
    for (const e of MANUSCRITO) {
      const b = el('button', `aba grupo-${e.grupo}`, open(e) ? e.nome : '???');
      b.type = 'button';
      b.dataset.id = e.id;
      b.onclick = () => this.show(e.id);
      nav.append(b);
    }
  }

  private show(id: string): void {
    const entry = entryById(id);
    if (!entry) return;
    this.current = id;
    window.clearInterval(timer);
    history.replaceState(null, '', `?p=${id}${ALL ? '&all' : ''}`);
    document.querySelectorAll<HTMLButtonElement>('.aba').forEach(b => {
      b.classList.toggle('on', b.dataset.id === id);
      b.setAttribute('aria-current', b.dataset.id === id ? 'page' : 'false');
    });
    const root = document.getElementById('pagina') as HTMLElement;
    root.textContent = '';
    const folha = page(this, entry);
    root.append(folha);
    const vida = folha.querySelector<HTMLElement>('.barra i');
    if (vida) requestAnimationFrame(() => { vida.style.width = '100%'; });
  }
}

bootPage(ManuscritoScene);
