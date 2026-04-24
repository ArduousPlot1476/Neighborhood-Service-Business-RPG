import Phaser from 'phaser';
import type { Facing } from '../../entities/Player';

export interface InputKeys {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  altUp: Phaser.Input.Keyboard.Key;
  altDown: Phaser.Input.Keyboard.Key;
  altLeft: Phaser.Input.Keyboard.Key;
  altRight: Phaser.Input.Keyboard.Key;
  interact: Phaser.Input.Keyboard.Key;
  altInteract: Phaser.Input.Keyboard.Key;
  cancel: Phaser.Input.Keyboard.Key;
  digits: ReadonlyArray<Phaser.Input.Keyboard.Key>;
  routeBook: Phaser.Input.Keyboard.Key;
  endDay: Phaser.Input.Keyboard.Key;
  save: Phaser.Input.Keyboard.Key;
  reset: Phaser.Input.Keyboard.Key;
  shift: Phaser.Input.Keyboard.Key;
}

export class PlayerController {
  constructor(private readonly speed: number) {}

  static createKeys(scene: Phaser.Scene): InputKeys {
    const kb = scene.input.keyboard;
    if (!kb) {
      throw new Error('PlayerController: keyboard input plugin is unavailable.');
    }
    const K = Phaser.Input.Keyboard.KeyCodes;
    const tabKey = kb.addKey(K.TAB);
    kb.addCapture('TAB');
    return {
      up: kb.addKey(K.W),
      down: kb.addKey(K.S),
      left: kb.addKey(K.A),
      right: kb.addKey(K.D),
      altUp: kb.addKey(K.UP),
      altDown: kb.addKey(K.DOWN),
      altLeft: kb.addKey(K.LEFT),
      altRight: kb.addKey(K.RIGHT),
      interact: kb.addKey(K.E),
      altInteract: kb.addKey(K.SPACE),
      cancel: kb.addKey(K.ESC),
      digits: [
        kb.addKey(K.ONE),
        kb.addKey(K.TWO),
        kb.addKey(K.THREE),
        kb.addKey(K.FOUR),
      ],
      routeBook: tabKey,
      endDay: kb.addKey(K.N),
      save: kb.addKey(K.S),
      reset: kb.addKey(K.R),
      shift: kb.addKey(K.SHIFT),
    };
  }

  update(sprite: Phaser.Physics.Arcade.Sprite, keys: InputKeys, locked: boolean): Facing | null {
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    if (locked) {
      body.setVelocity(0, 0);
      return null;
    }

    const left = keys.left.isDown || keys.altLeft.isDown;
    const right = keys.right.isDown || keys.altRight.isDown;
    const up = keys.up.isDown || keys.altUp.isDown;
    const down = keys.down.isDown || keys.altDown.isDown;

    let vx = 0;
    let vy = 0;
    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      vx = (vx / len) * this.speed;
      vy = (vy / len) * this.speed;
    }

    body.setVelocity(vx, vy);

    if (Math.abs(vx) > Math.abs(vy)) {
      if (vx > 0) return 'right';
      if (vx < 0) return 'left';
    } else if (vy !== 0) {
      if (vy > 0) return 'down';
      if (vy < 0) return 'up';
    }
    return null;
  }
}
