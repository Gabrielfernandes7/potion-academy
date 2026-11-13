// O botão de toque da habilidade (X) muda de nome com a forma: HABILIDADE, LABAREDA ou BOLHA.
export const NO_FORM_LABEL = 'HABILIDADE';

export function setAbilityLabel(label: string): void {
  const el = document.getElementById('ability-btn');
  if (el && el.textContent !== label) el.textContent = label;
}
