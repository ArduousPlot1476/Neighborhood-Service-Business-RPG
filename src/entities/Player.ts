import Phaser from 'phaser';
import { characterTextureKey } from '../content/art/sunlitCharacters';

export type Facing = 'up' | 'down' | 'left' | 'right';

export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  facing: Facing = 'down';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, characterTextureKey('player'));
    this.sprite.setDepth(10);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(8, 4);
    body.setOffset(4, 20);
  }
}
