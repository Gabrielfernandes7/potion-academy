// Itens no chão: moedas, gemas, baús, corações e power-ups. Nascem quando um caixote quebra ou
// um inimigo morre, e são coletados quando a Roo pisa na casa (coordenadas de grade).
// As regras puras estão em game/pickupRules.ts e game/rewards.ts.
import Phaser from 'phaser';
import { BOMB_TYPES, CONFIG } from '../config';
import { Bank } from '../storage';
import { PICKUP_HALO, PICKUP_TEXTURE, PickupType, rollChestCoins, rollReward } from './rewards';
import { pickupAt, resolveRewardType, timeAfterBonus } from './pickupRules';
import { addBombSlot, addFireLevel } from './upgrades';
import type { Pickup } from './types';
import type { MainScene } from '../scenes/MainScene';

export class PickupSystem {
  pickups: Pickup[] = [];

  constructor(private readonly scene: MainScene) {}

  spawnReward(x: number, y: number): void {
    if (this.scene.gemBlocks.has(`${x},${y}`)) {
      this.spawnPickupSprite(x, y, 'gem');
      return;
    }
    const type = rollReward();
    // na fase do chefe não há porta: gema vira moeda
    const final = resolveRewardType(type, !!this.scene.def.door);
    // o baú já nasce com o valor sorteado pela tabela desta fase
    const value = final === 'chest' ? rollChestCoins(this.scene.def.chest) : undefined;
    this.spawnPickupSprite(x, y, final, value);
  }

  spawnPickupSprite(x: number, y: number, type: PickupType, value?: number): void {
    const sprite = this.scene.add.image(
      x * CONFIG.tile + CONFIG.tile / 2,
      y * CONFIG.tile + CONFIG.tile / 2,
      PICKUP_TEXTURE[type],
    ).setDepth(6);
    this.scene.tweens.add({
      targets: sprite, y: sprite.y - 4,
      duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    const haloColor = PICKUP_HALO[type];
    let halo: Phaser.GameObjects.Image | undefined;
    if (haloColor !== undefined) {
      halo = this.scene.add.image(sprite.x, sprite.y, 'menu_puff').setScale(0.95).setTint(haloColor)
        .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.3).setDepth(5);
      this.scene.tweens.add({
        targets: halo, alpha: { from: 0.18, to: 0.42 }, scale: { from: 0.85, to: 1.05 },
        duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }
    this.pickups.push({ gridX: x, gridY: y, type, value, sprite, halo });
  }

  // "Fogo", "Aqua"...: a poção que recebeu o power-up
  private potionShortName(): string {
    return BOMB_TYPES[this.scene.bombType].label.replace('Poção ', '').replace('de ', '').toUpperCase();
  }

  collectPickup(pickup: Pickup): void {
    const s = this.scene;
    switch (pickup.type) {
      case 'coin':
        s.coins += CONFIG.coinPickupValue;
        Bank.add(CONFIG.coinPickupValue);
        s.play('pickup');
        break;
      case 'gem':
        s.gems += 1;
        s.play('pickup');
        if (s.gems >= CONFIG.gemsForDoor && !s.doorOpen) s.openDoor();
        break;
      case 'chest': {
        const coins = pickup.value ?? 5;
        s.coins += coins;
        Bank.add(coins);
        s.play('powerup'); // o baú só dá POÇÃO: a cura vem dos corações (ver docs/06-decisoes.md)
        break;
      }
      case 'heart':
        s.player.hp = Math.min(CONFIG.maxHp, s.player.hp + 1);
        s.play('pickup');
        break;
      case 'bomb_up':
        addBombSlot(s.player.upgrades, s.bombType);
        s.powerupsCollected.bomb_up++;
        s.floatingText(pickup.gridX, pickup.gridY, `+1 FRASCO ${this.potionShortName()}`, '#b39ddb');
        s.play('powerup');
        break;
      case 'fire_up':
        addFireLevel(s.player.upgrades, s.bombType);
        s.powerupsCollected.fire_up++;
        s.floatingText(pickup.gridX, pickup.gridY, `+1 RAIO ${this.potionShortName()}`, '#ff8a65');
        s.play('powerup');
        break;
      case 'speed_up':
        s.player.speedUp = Math.min(CONFIG.maxSpeedUp, s.player.speedUp + 1);
        s.powerupsCollected.speed_up++;
        s.floatingText(pickup.gridX, pickup.gridY, '+VELOCIDADE', '#4dd0e1');
        s.play('powerup');
        break;
      case 'time_up':
        s.timeLeft = timeAfterBonus(s.timeLeft, CONFIG.timeUpBonus, s.def.time);
        s.powerupsCollected.time_up++;
        s.floatingText(pickup.gridX, pickup.gridY, '+15s', '#fff59d');
        s.play('powerup');
        break;
    }
    s.tweens.killTweensOf(pickup.sprite);
    pickup.sprite.destroy();
    if (pickup.halo) {
      s.tweens.killTweensOf(pickup.halo);
      pickup.halo.destroy();
    }
    this.pickups = this.pickups.filter(p => p !== pickup);
    s.updateHud();
  }

  checkPickups(): void {
    if (this.scene.gameOver || this.scene.won) return;
    const found = pickupAt(this.pickups, this.scene.player.gridX, this.scene.player.gridY);
    if (found) this.collectPickup(found);
  }
}
