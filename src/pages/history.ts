// Livro da história (history.html): navegação do índice e interruptor das notas para o jogo.
// O texto vive no HTML; aqui só há comportamento. Fonte do roteiro: docs/12-historia.md.
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import '../styles/history.css';

const NOTES_KEY = 'history_notes';

function readPref(): boolean {
  try { return localStorage.getItem(NOTES_KEY) !== 'off'; } catch { return true; }
}

function writePref(on: boolean): void {
  try { localStorage.setItem(NOTES_KEY, on ? 'on' : 'off'); } catch { /* sem armazenamento: vale só nesta visita */ }
}

// Notas "Para o jogo" ligadas ou não (o leitor que só quer a história desliga).
const toggle = document.getElementById('notes-toggle') as HTMLInputElement | null;
const applyNotes = (on: boolean): void => { document.body.classList.toggle('no-notes', !on); };
if (toggle) {
  toggle.checked = readPref();
  applyNotes(toggle.checked);
  toggle.addEventListener('change', () => { applyNotes(toggle.checked); writePref(toggle.checked); });
}

// O capítulo visível acende o item do índice.
const links = new Map<string, HTMLAnchorElement>();
document.querySelectorAll<HTMLAnchorElement>('.toc a[href^="#"]').forEach(a => links.set(a.hash.slice(1), a));

const chapters = document.querySelectorAll<HTMLElement>('.chapter');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach(a => a.removeAttribute('aria-current'));
      links.get(e.target.id)?.setAttribute('aria-current', 'true');
    }
  }, { rootMargin: '-20% 0px -70% 0px' });
  chapters.forEach(c => io.observe(c));
}

// Cena do nascimento da Roo: o jogo (Phaser) só é carregado quando a pessoa aperta o botão.
const playBtn = document.getElementById('birth-play') as HTMLButtonElement | null;
const birthCanvas = document.getElementById('birth-canvas') as HTMLCanvasElement | null;
const birthCaption = document.getElementById('birth-caption');
if (playBtn && birthCanvas && birthCaption) {
  playBtn.addEventListener('click', async () => {
    playBtn.disabled = true;
    playBtn.textContent = 'Carregando...';
    try {
      const { playBirthScene } = await import('./birthScene');
      birthCanvas.hidden = false;
      playBtn.textContent = 'Tocando...';
      await playBirthScene(birthCanvas, birthCaption);
      playBtn.textContent = 'Ver de novo';
    } catch {
      birthCaption.textContent = 'Não foi possível carregar a cena.';
      playBtn.textContent = 'Tentar de novo';
    }
    playBtn.disabled = false;
  });
}
