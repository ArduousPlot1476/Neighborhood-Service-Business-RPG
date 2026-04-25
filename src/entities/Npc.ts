import Phaser from 'phaser';
import { TILE_SIZE } from '../game/config';
import { characterTextureKey } from '../content/art/sunlitCharacters';
import { PROSPECT_STATUS_COLOR, type ProspectStatus } from '../state/prospects';
import type { NpcData } from '../types';

export class Npc {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly data: NpcData;
  private readonly badge: Phaser.GameObjects.Rectangle;
  private readonly jobMarker: Phaser.GameObjects.Text;
  private readonly contestedMarker: Phaser.GameObjects.Text;
  private status: ProspectStatus = 'unknown';
  private jobReady = false;
  private contested = false;
  private markerTween: Phaser.Tweens.Tween | null = null;
  private contestedTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, data: NpcData) {
    this.data = data;
    const worldX = data.tileX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = data.tileY * TILE_SIZE + TILE_SIZE / 2;

    const textureKey = characterTextureKey(data.id);
    const fallbackKey = scene.textures.exists(textureKey) ? textureKey : characterTextureKey('player');

    this.sprite = scene.physics.add.sprite(worldX, worldY, fallbackKey);
    this.sprite.setDepth(9);
    this.sprite.setData('npcId', data.id);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(8, 4);
    body.setOffset(4, 20);
    body.setImmovable(true);

    this.badge = scene.add.rectangle(worldX, worldY - 16, 4, 4, PROSPECT_STATUS_COLOR.unknown, 1);
    this.badge.setStrokeStyle(1, 0x1a1410);
    this.badge.setDepth(11);
    this.badge.setVisible(false);

    this.jobMarker = scene.add
      .text(worldX, worldY - 22, '!', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#f0c43a',
        stroke: '#1a1410',
        strokeThickness: 2,
      })
      .setOrigin(0.5, 1)
      .setDepth(12);
    this.jobMarker.setVisible(false);

    this.contestedMarker = scene.add
      .text(worldX, worldY - 30, 'RIVAL', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#a23a1c',
        stroke: '#f4e9d0',
        strokeThickness: 2,
      })
      .setOrigin(0.5, 1)
      .setDepth(13);
    this.contestedMarker.setVisible(false);

    this.markerTween = scene.tweens.add({
      targets: this.jobMarker,
      y: this.jobMarker.y - 2,
      duration: 600,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
    this.contestedTween = scene.tweens.add({
      targets: this.contestedMarker,
      alpha: 0.55,
      duration: 700,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  setStatus(status: ProspectStatus): void {
    this.status = status;
    if (status === 'unknown') {
      this.badge.setVisible(false);
      return;
    }
    this.badge.setFillStyle(PROSPECT_STATUS_COLOR[status], 1);
    this.badge.setVisible(true);
  }

  setJobReady(ready: boolean): void {
    if (this.jobReady === ready) return;
    this.jobReady = ready;
    this.jobMarker.setVisible(ready);
  }

  setContested(contested: boolean): void {
    if (this.contested === contested) return;
    this.contested = contested;
    this.contestedMarker.setVisible(contested);
  }

  get currentStatus(): ProspectStatus {
    return this.status;
  }

  get hasJobReady(): boolean {
    return this.jobReady;
  }

  get isContested(): boolean {
    return this.contested;
  }

  destroy(): void {
    if (this.markerTween) {
      this.markerTween.stop();
      this.markerTween = null;
    }
    if (this.contestedTween) {
      this.contestedTween.stop();
      this.contestedTween = null;
    }
    this.contestedMarker.destroy();
    this.jobMarker.destroy();
    this.badge.destroy();
    this.sprite.destroy();
  }
}
