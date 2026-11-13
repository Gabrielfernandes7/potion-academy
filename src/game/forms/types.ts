// O molde de uma transformação da Roo (puro, sem Phaser). Cada forma é um dado (FormDef) mais, se precisar,
// regras próprias (fire.ts, water.ts). A máquina de estados é uma só (RooForm.ts): para criar uma forma nova,
// veja docs/16-guia-de-extensao.md.
import type { ElementId } from '../../config';
import type { DamageProfile } from '../entities/damage';

export type FormId = 'fire' | 'water';
export type FormStage = 0 | 1 | 2 | 3 | 4;

/** A habilidade da forma (tecla X): gasta um pedaço da própria transformação e tem espera. */
export interface FormAbility {
  id: 'flame' | 'bubble';
  nome: string;
  short: string; // rótulo curto do botão de toque
  costMs: number;
  cooldownMs: number;
  range: number; // casas à frente
}

export interface FormDef {
  id: FormId;
  nome: string;
  element: ElementId; // o atributo da forma
  transformKey: string; // tecla que transforma (maiúscula, para mostrar na ajuda e na HUD)
  /** Perfil de dano da Roo naquele degrau (o que a machuca muda com a forma). */
  profile(stage: FormStage): DamageProfile;
  /** Bônus de dano das poções do próprio elemento no auge (0,5 = +50%); cai a cada degrau. */
  boost: number;
  /** Poção que a forma não deixa usar (o elemento dela), se houver. */
  forbids?: ElementId;
  ability: FormAbility;
}
