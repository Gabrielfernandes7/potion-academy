// O botão de toque da habilidade (X) muda de nome com a forma: HABILIDADE, LABAREDA, BOLHA, MURO ou SOPRO.
export const NO_FORM_LABEL = 'HABILIDADE';

export function setAbilityLabel(label: string): void {
  const el = document.getElementById('ability-btn');
  if (el && el.textContent !== label) el.textContent = label;
}

// O botão da segunda habilidade (C): só aparece quando a forma ativa tem uma (RAIZ, SALTO).
export function setAbility2Label(label: string | null): void {
  const el = document.getElementById('ability2-btn');
  if (!el) return;
  el.hidden = label === null;
  if (label !== null && el.textContent !== label) el.textContent = label;
}

// O botão da defesa (V): aparece com qualquer forma ativa (ESCUDO, BOLHA, CÍRCULO, VENTO).
export function setDefenseLabel(label: string | null): void {
  const el = document.getElementById('defense-btn');
  if (!el) return;
  el.hidden = label === null;
  if (label !== null && el.textContent !== label) el.textContent = label;
}
