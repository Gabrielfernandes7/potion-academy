// Salvar e carregar o progresso em arquivo (botões discretos no menu). A regra está em saveFile.ts.
import { SAVE_FILE_NAME, exportSave, importSave } from '../saveFile';
import { byId } from './dom';

const MAX_FILE_BYTES = 200_000;

function say(text: string, ok: boolean): void {
  const el = byId('menu-save-msg');
  el.textContent = text;
  el.classList.toggle('bad', !ok);
}

function download(text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = SAVE_FILE_NAME;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function bindSaveTransfer(): void {
  const input = byId<HTMLInputElement>('menu-save-file');
  byId('menu-save-export').onclick = () => {
    download(exportSave());
    say('Progresso salvo no arquivo ' + SAVE_FILE_NAME + '.', true);
  };
  byId('menu-save-import').onclick = () => input.click();
  input.onchange = async () => {
    const file = input.files?.[0];
    input.value = ''; // permite escolher o mesmo arquivo de novo
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) { say('O arquivo é grande demais para ser um progresso do jogo.', false); return; }
    const result = importSave(await file.text());
    if (!result.ok) say(result.error, false);
    else say(result.added > 0 ? `Progresso carregado: ${result.added} ${result.added === 1 ? 'item novo' : 'itens novos'}.` : 'Progresso carregado: você já tinha tudo o que estava no arquivo.', true);
  };
}
