// Contrato de um experimento do lab. Cada experimento é um módulo em lab/experiments/ que exporta
// um LabExperiment e é registrado em lab/registry.ts. O lab é só desenvolvimento (não entra no build).
import type Phaser from 'phaser';

export interface LabExperiment {
  id: string;                                   // vai na URL: /lab.html?exp=<id>
  title: string;                                // nome na barra de experimentos
  summary: string;                              // uma frase sobre o que se testa
  size: { cols: number; rows: number; tile?: number }; // tamanho do palco, em casas (tile padrão: 40)
  panelHtml: string;                            // controles do painel lateral (HTML)
  scene: new () => Phaser.Scene;                // a cena Phaser do experimento
}
