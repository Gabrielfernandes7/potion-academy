// Mapa de seleção de fases: mostra progresso de quais fases foram concluídas.
import Phaser from 'phaser';
import { CANVAS } from '../config';
import { readTheme } from '../ui/theme';
import { isStageCompleted } from '../storage';

interface MapLocation {
  stage: number;
  label: string;
  x: number;
  y: number;
  r: number;
}

export class MapScene extends Phaser.Scene {
  locations: MapLocation[] = [];

  constructor() {
    super('Map');
  }

  create(): void {
    const w = CANVAS.width;
    const h = CANVAS.height;
    const theme = readTheme();
    const textColor = `#${theme.text.toString(16).padStart(6, '0')}`;
    const goldColor = `#${theme.gold.toString(16).padStart(6, '0')}`;

    // Desenhar castelo
    const gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0x2c2c2c, 1);
    gfx.fillRect(0, 0, w, h);

    const stone = 0x3a3a3a;
    const stoneLight = 0x4a4a4a;
    const wallLight = 0x8a7a6f;
    gfx.fillStyle(stone, 1);
    gfx.fillRect(w * 0.1, h * 0.2, w * 0.8, h * 0.7);

    const towers = [
      { x: w * 0.08, y: h * 0.15 },
      { x: w * 0.92, y: h * 0.15 },
      { x: w * 0.08, y: h * 0.95 },
      { x: w * 0.92, y: h * 0.95 },
    ];
    gfx.fillStyle(stoneLight, 1);
    towers.forEach(t => {
      gfx.fillRect(t.x - 15, t.y - 30, 30, 60);
      gfx.fillStyle(wallLight, 1);
      for (let i = 0; i < 5; i++) {
        gfx.fillRect(t.x - 12 + i * 5, t.y - 35, 3, 8);
      }
      gfx.fillStyle(stoneLight, 1);
    });

    gfx.lineStyle(3, wallLight, 1);
    gfx.lineBetween(w * 0.25, h * 0.2, w * 0.25, h * 0.9);
    gfx.lineBetween(w * 0.75, h * 0.2, w * 0.75, h * 0.9);

    gfx.generateTexture('castle', w, h);
    gfx.destroy();
    this.add.image(w / 2, h / 2, 'castle').setOrigin(0.5).setDepth(-1);

    // Título
    this.add.text(w / 2, h * 0.08, 'MAPA DO CASTELO', {
      fontFamily: theme.fontDisplay,
      fontSize: '28px',
      color: textColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(10);

    // Fases
    this.locations = [
      { stage: 1, label: 'LABORATÓRIO', x: w * 0.25, y: h * 0.6, r: 40 },
      { stage: 2, label: 'SALÃO DOS\nFANTASMAS', x: w * 0.75, y: h * 0.6, r: 40 },
      { stage: 3, label: 'DUELO', x: w * 0.25, y: h * 0.25, r: 40 },
      { stage: 4, label: 'JARDIM', x: w * 0.75, y: h * 0.25, r: 40 },
    ];

    this.locations.forEach(loc => {
      const completed = isStageCompleted(loc.stage);
      const baseColor = completed ? 0x6b5b4f : 0x3a5a3a;
      const hoverColor = completed ? 0x8a7a6f : 0x5a7a5a;

      const circle = this.add.circle(loc.x, loc.y, loc.r, baseColor, 0.8).setInteractive(
        new Phaser.Geom.Circle(0, 0, loc.r),
        Phaser.Geom.Circle.Contains,
      ).setDepth(5);

      if (completed) {
        this.add.text(loc.x + 25, loc.y - 25, '✓', {
          fontFamily: theme.fontDisplay,
          fontSize: '24px',
          color: goldColor,
        }).setOrigin(0.5).setDepth(7);
      }

      const text = this.add.text(loc.x, loc.y - 10, loc.label, {
        fontFamily: theme.fontBody,
        fontSize: '14px',
        color: textColor,
        align: 'center',
        wordWrap: { width: 80 },
      }).setOrigin(0.5).setDepth(6);

      circle.on('pointerdown', () => this.loadStage(loc.stage));
      circle.on('pointerover', () => {
        circle.setFillStyle(hoverColor, 0.9);
        text.setColor(goldColor);
      });
      circle.on('pointerout', () => {
        circle.setFillStyle(baseColor, 0.8);
        text.setColor(textColor);
      });
    });

    // Botão voltar
    const menuBtnBg = this.add.rectangle(w * 0.5, h - 40, 180, 40, 0x1a1a1a, 0.9)
      .setInteractive()
      .setDepth(5);

    const menuBtnText = this.add.text(w * 0.5, h - 40, 'MENU', {
      fontFamily: theme.fontBody,
      fontSize: '16px',
      color: textColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(6);

    menuBtnBg.on('pointerdown', () => this.backToMenu());
    menuBtnBg.on('pointerover', () => {
      menuBtnBg.setFillStyle(0x2a2a2a, 0.9);
      menuBtnText.setColor(goldColor);
    });
    menuBtnBg.on('pointerout', () => {
      menuBtnBg.setFillStyle(0x1a1a1a, 0.9);
      menuBtnText.setColor(textColor);
    });

    // Teclado
    this.input.keyboard?.on('keydown-ESC', () => this.backToMenu());
    this.input.keyboard?.on('keydown-ONE', () => this.loadStage(1));
    this.input.keyboard?.on('keydown-TWO', () => this.loadStage(2));
    this.input.keyboard?.on('keydown-THREE', () => this.loadStage(3));
    this.input.keyboard?.on('keydown-FOUR', () => this.loadStage(4));

    // Dica
    this.add.text(w / 2, h - 80, 'Clique em uma fase ou pressione 1, 2, 3, 4', {
      fontFamily: theme.fontBody,
      fontSize: '12px',
      color: theme.textMuted,
      align: 'center',
    }).setOrigin(0.5).setDepth(5);
  }

  private loadStage(stage: number): void {
    const game = this.game;
    game.scene.stop('Map');
    game.scene.start('Main', { stage });
  }

  private backToMenu(): void {
    const game = this.game;
    game.scene.stop('Map');
    game.scene.start('Menu');
  }
}
