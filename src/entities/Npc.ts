import Phaser from 'phaser';
import { TILE_SIZE } from '../game/config';
import { PERSON_KEY } from '../scenes/PreloadScene';
import type { NpcData } from '../types';

export class Npc {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly data: NpcData;

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
  }
}
