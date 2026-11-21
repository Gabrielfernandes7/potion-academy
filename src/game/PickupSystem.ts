// Itens no chão: gemas, baús, corações e power-ups. Nascem quando um caixote quebra ou um inimigo
// morre, e são coletados quando a Roo pisa na casa (coordenadas de grade).
// As regras puras estão em game/pickupRules.ts e game/rewards.ts.
import Phaser from 'phaser';
import { BOMB_ORDER, BOMB_TYPES, BombId, CONFIG } from '../config';
import { canUseBomb } from './loadout';
import { PickupType, isPotionPowerup, pickupHalo, pickupTexture, rollChestPrize, rollReward } from './rewards';
import { pickPowerupPotion, pickupAt, resolveRewardType, timeAfterBonus } from './pickupRules';
import { addBombSlot, addFireLevel } from './upgrades';
import type { Pickup } from './types';
import { HEART_HEAL, healRoo } from './entities/roo';
import type { MainScene } from '../scenes/MainScene';

export class PickupSystem {
  pickups: Pickup[] = [];

  constructor(private readonly scene: MainScene) {}

  // Sorteio de um bloco destruído. Pode não sair nada (bloco vazio).
  spawnReward(x: number, y: number): void {
    if (this.scene.gemBlocks.has(`${x},${y}`)) {
      this.spawnPickupSprite(x, y, 'gem');
      return;
    }
    const rolled = rollReward();
    if (rolled === null) return;
    // na fase do chefe não há porta: a gema não nasce
    const final = resolveRewardType(rolled, !!this.scene.def.door && !this.scene.isBossStage);
    if (final === null) return;
    // o baú já nasce com o item sorteado pela tabela desta fase
    const prize = final === 'chest' ? rollChestPrize(this.scene.def.chest) : undefined;
    // +frasco e +raio nascem já com a poção que fortalecem (uma das que a Roo tem)
    const shown = prize ?? final;
    const potion = isPotionPowerup(shown) ? pickPowerupPotion(BOMB_ORDER.filter(canUseBomb)) : undefined;
    this.spawnPickupSprite(x, y, final, prize, potion);
  }

  spawnPickupSprite(x: number, y: number, type: PickupType, prize?: PickupType, potion?: BombId): void {
    const sprite = this.scene.add.image(
      x * CONFIG.tile + CONFIG.tile / 2,
      y * CONFIG.tile + CONFIG.tile / 2,
      pickupTexture(type, potion),
    ).setDepth(6);
    this.scene.tweens.add({
      targets: sprite, y: sprite.y - 4,
      duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    const haloColor = pickupHalo(type, potion);
    let halo: Phaser.GameObjects.Image | undefined;
    if (haloColor !== undefined) {
      halo = this.scene.add.image(sprite.x, sprite.y, 'menu_puff').setScale(0.95).setTint(haloColor)
        .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.3).setDepth(5);
      this.scene.tweens.add({
        targets: halo, alpha: { from: 0.18, to: 0.42 }, scale: { from: 0.85, to: 1.05 },
        duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }
    this.pickups.push({ gridX: x, gridY: y, type, prize, potion, sprite, halo });
  }

  // "Fogo", "Água"...: a poção que recebeu o power-up
  private potionShortName(potion: BombId): string {
    return BOMB_TYPES[potion].label.replace('Poção ', '').replace('de ', '').toUpperCase();
  }

  /** Tira um item do chão sem dar o efeito dele (o ratinho o leva). Devolve o que era, para quem precisar devolver. */
  removePickup(pickup: Pickup): { type: PickupType; prize?: PickupType; potion?: BombId } {
    const s = this.scene;
    s.tweens.killTweensOf(pickup.sprite);
    pickup.sprite.destroy();
    if (pickup.halo) {
      s.tweens.killTweensOf(pickup.halo);
      pickup.halo.destroy();
    }
    this.pickups = this.pickups.filter(p => p !== pickup);
    s.updateHud();
    return { type: pickup.type, prize: pickup.prize, potion: pickup.potion };
  }

  collectPickup(pickup: Pickup): void {
    const s = this.scene;
    // o baú abre na hora e dá o item sorteado para ele
    this.applyItem(pickup.type === 'chest' ? (pickup.prize ?? 'heart') : pickup.type, pickup);
    s.tweens.killTweensOf(pickup.sprite);
    pickup.sprite.destroy();
    if (pickup.halo) {
      s.tweens.killTweensOf(pickup.halo);
      pickup.halo.destroy();
    }
    this.pickups = this.pickups.filter(p => p !== pickup);
    s.updateHud();
  }

  private applyItem(type: PickupType, pickup: Pickup): void {
    const s = this.scene;
    if (type !== 'chest') s.playPose('pickup'); // ergue o item num pulinho
    switch (type) {
      case 'gem':
        s.gems += 1;
        s.play('pickup');
        if (s.gems >= CONFIG.gemsForDoor && !s.doorOpen) s.openDoor();
        break;
      case 'chest':
        // nunca chega aqui: o baú é aberto em collectPickup
        break;
      case 'heart':
        s.player.hp = healRoo(s.player.hp);
        s.floatingText(pickup.gridX, pickup.gridY, `+${HEART_HEAL}`, '#9be564');
        s.play('pickup');
        break;
      case 'bomb_up':
        addBombSlot(s.player.upgrades, pickup.potion ?? 'normal');
        s.powerupsCollected.bomb_up++;
        s.floatingText(pickup.gridX, pickup.gridY, `+1 FRASCO ${this.potionShortName(pickup.potion ?? 'normal')}`, '#b39ddb');
        s.play('powerup');
        break;
      case 'fire_up':
        addFireLevel(s.player.upgrades, pickup.potion ?? 'normal');
        s.powerupsCollected.fire_up++;
        s.floatingText(pickup.gridX, pickup.gridY, `+1 RAIO ${this.potionShortName(pickup.potion ?? 'normal')}`, '#ff8a65');
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
  }

  checkPickups(): void {
    if (this.scene.gameOver || this.scene.won) return;
    const { gridX, gridY } = this.scene.player;
    const found = pickupAt(this.pickups, gridX, gridY);
    if (!found) return;
    this.collectPickup(found);
  }
}
