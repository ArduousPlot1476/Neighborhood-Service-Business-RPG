import Phaser from 'phaser';
import { TILE_SIZE } from '../game/config';
import { PERSON_KEY } from '../scenes/PreloadScene';
import { PROSPECT_STATUS_COLOR, type ProspectStatus } from '../state/prospects';
import type { NpcData } from '../types';

export class Npc {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly data: NpcData;
  private readonly badge: Phaser.GameObjects.Rectangle;
  private readonly jobMarker: Phaser.GameObjects.Text;
  private status: ProspectStatus = 'unknown';
  private jobReady = false;
  private markerTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, data: NpcData) {
    this.data = data;
    const worldX = data.tileX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = data.tileY * TILE_SIZE + TILE_SIZE / 2;

    this.sprite = scene.physics.add.sprite(worldX, worldY, PERSON_KEY);
    this.sprite.setTint(data.tint);
    this.sprite.setDepth(9);
    this.sprite.setData('npcId', data.id);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(8, 4);
    body.setOffset(2, 11);
    body.setImmovable(true);

    this.badge = scene.add.rectangle(worldX, worldY - 11, 4, 4, PROSPECT_STATUS_COLOR.unknown, 1);
    this.badge.setStrokeStyle(1, 0x0f1a14);
    this.badge.setDepth(11);
    this.badge.setVisible(false);

    this.jobMarker = scene.add
      .text(worldX, worldY - 18, '!', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#f0c878',
        stroke: '#0f1a14',
        strokeThickness: 2,
      })
      .setOrigin(0.5, 1)
      .setDepth(12);
    this.jobMarker.setVisible(false);

    this.markerTween = scene.tweens.add({
      targets: this.jobMarker,
      y: this.jobMarker.y - 2,
      duration: 600,
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

  get currentStatus(): ProspectStatus {
    return this.status;
  }

  get hasJobReady(): boolean {
    return this.jobReady;
  }

  destroy(): void {
    if (this.markerTween) {
      this.markerTween.stop();
      this.markerTween = null;
    }
    this.jobMarker.destroy();
    this.badge.destroy();
    this.sprite.destroy();
  }
}
