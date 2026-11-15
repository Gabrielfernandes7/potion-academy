// A máquina de estados das transformações (pura): uma forma por vez, 20 s, esfriando em 4 degraus, com uma
// espera comum depois que acaba, e a habilidade da forma (X) gastando um pedaço do tempo. Quem define
// o que cada forma faz é o FormDef (fire.ts, water.ts); aqui só há tempo e estado.
import type { ElementId } from '../../config';
import { FORM_COOLDOWN_MS, FORM_MS, formStage } from './stages';
import { FORMS } from './registry';
import type { FormDef, FormId, FormStage } from './types';

export class RooForm {
  private kind: FormId | null = null;
  private remaining = 0;
  private cooldown = 0;
  private abilityCd = 0;
  private ability2Cd = 0;
  private defenseCd = 0;

  /** A forma ativa (ou null). */
  get id(): FormId | null { return this.kind; }
  get def(): FormDef | null { return this.kind ? FORMS[this.kind] : null; }
  get active(): boolean { return this.remaining > 0; }
  get stage(): FormStage { return formStage(this.remaining); }
  get remainingMs(): number { return this.remaining; }
  get cooldownMs(): number { return this.cooldown; }
  get abilityCooldownMs(): number { return this.abilityCd; }
  get ability2CooldownMs(): number { return this.ability2Cd; }
  get defenseReady(): boolean { return this.active && this.defenseCd <= 0; }
  get ready(): boolean { return !this.active && this.cooldown <= 0; }
  get abilityReady(): boolean { return this.active && this.abilityCd <= 0; }
  /** A segunda habilidade (tecla C) existe nesta forma e está pronta? */
  get ability2Ready(): boolean { return this.active && !!this.def?.ability2 && this.ability2Cd <= 0; }
  /** O elemento que a forma usa agora (só as poções dele funcionam enquanto ela dura), ou null. */
  get formElement(): ElementId | null { return this.active ? this.def?.element ?? null : null; }

  /** Transforma na forma pedida, se der (nenhuma ativa e sem espera). Devolve se transformou. */
  start(id: FormId): boolean {
    if (!this.ready) return false;
    this.kind = id;
    this.remaining = FORM_MS;
    this.abilityCd = 0;
    this.ability2Cd = 0;
    this.defenseCd = 0;
    return true;
  }

  /** Habilidade da forma: só transformada e fora da espera. Gasta parte da transformação (pode encerrá-la). */
  useAbility(): boolean {
    const d = this.def;
    if (!d || !this.abilityReady) return false;
    this.abilityCd = d.ability.cooldownMs;
    this.spend(d.ability.costMs);
    return true;
  }

  /** Defesa (V): gasta tempo da forma e começa a espera. Devolve a defesa, ou null se não der. */
  useDefense(): FormDef['defense'] | null {
    const d = this.def?.defense;
    if (!d || !this.defenseReady) return null;
    this.defenseCd = d.cooldownMs;
    this.spend(d.costMs);
    return d;
  }

  /** Segunda habilidade (C): como a primeira, com espera própria. Devolve false se a forma não tem. */
  useAbility2(): boolean {
    const d = this.def?.ability2;
    if (!d || !this.ability2Ready) return false;
    this.ability2Cd = d.cooldownMs;
    this.spend(d.costMs);
    return true;
  }

  /** Gasta tempo da transformação; se zerar, ela acaba e começa a espera. */
  spend(ms: number): void {
    if (this.remaining <= 0) return;
    this.remaining = Math.max(0, this.remaining - ms);
    if (this.remaining === 0) this.cooldown = FORM_COOLDOWN_MS;
  }

  tick(deltaMs: number): void {
    this.abilityCd = Math.max(0, this.abilityCd - deltaMs);
    this.ability2Cd = Math.max(0, this.ability2Cd - deltaMs);
    this.defenseCd = Math.max(0, this.defenseCd - deltaMs);
    if (this.remaining > 0) this.spend(deltaMs);
    else if (this.cooldown > 0) this.cooldown = Math.max(0, this.cooldown - deltaMs);
  }
}

export interface FormView {
  form: FormId | null; // a forma ativa
  active: boolean;
  stage: FormStage;
  ratio: number; // quanto resta da transformação (1 a 0)
  cooldownRatio: number; // quanto falta para poder transformar de novo (1 a 0)
  abilityReady: boolean;
  ability2Ready: boolean; // a habilidade da tecla C (Raiz, Salto de vento)
  defenseReady: boolean; // a defesa (tecla V) está pronta
  guarding: boolean; // a defesa está de pé agora
  element: ElementId | null; // o elemento da forma agora (só essa poção funciona)
}

/** O que a HUD precisa saber da transformação. */
export function formView(f: RooForm): FormView {
  return {
    form: f.active ? f.id : null,
    active: f.active,
    stage: f.stage,
    ratio: f.active ? f.remainingMs / FORM_MS : 0,
    cooldownRatio: f.cooldownMs / FORM_COOLDOWN_MS,
    abilityReady: f.abilityReady,
    ability2Ready: f.ability2Ready,
    defenseReady: f.defenseReady,
    guarding: false, // a RooFormSystem preenche (a defesa é estado de jogo, não da máquina de tempo)
    element: f.formElement,
  };
}
