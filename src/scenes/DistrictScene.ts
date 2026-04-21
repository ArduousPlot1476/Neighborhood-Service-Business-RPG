import Phaser from 'phaser';
import { TILE_SIZE } from '../game/config';
import { Player } from '../entities/Player';
import { Npc } from '../entities/Npc';
import { PlayerController, type InputKeys } from '../systems/input/PlayerController';
import { InteractionPrompt } from '../systems/interactions/InteractionPrompt';
import { InteractionPanel } from '../systems/interactions/InteractionPanel';
import { starterDistrict } from '../content/districts/starterDistrict';
import { starterDistrictNpcs } from '../content/npcs/starterDistrictNpcs';
import { SOLID_TILE_INDICES, TILESET_KEY } from './PreloadScene';
import type { SceneState } from '../types';

const INTERACT_RADIUS = TILE_SIZE * 1.4;
const PLAYER_SPEED = 110;

export class DistrictScene extends Phaser.Scene {
  private player!: Player;
  private controller!: PlayerController;
  private keys!: InputKeys;
  private npcs: Npc[] = [];
  private prompt!: InteractionPrompt;
  private panel!: InteractionPanel;
  private state: SceneState = 'EXPLORING';

  constructor() {
    super({ key: 'DistrictScene' });
  }

  create(): void {
    const district = starterDistrict;

    const map = this.make.tilemap({
      data: district.tiles.map((row) => [...row]),
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });
    const tileset = map.addTilesetImage(TILESET_KEY, TILESET_KEY, TILE_SIZE, TILE_SIZE, 0, 0);
    if (!tileset) {
      throw new Error('DistrictScene: failed to register tileset image.');
    }
    const layer = map.createLayer(0, tileset, 0, 0);
    if (!layer) {
      throw new Error('DistrictScene: failed to create tile layer.');
    }
    layer.setCollision([...SOLID_TILE_INDICES]);
    layer.setDepth(0);

    const worldWidth = district.width * TILE_SIZE;
    const worldHeight = district.height * TILE_SIZE;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    const spawnX = district.spawn.tileX * TILE_SIZE + TILE_SIZE / 2;
    const spawnY = district.spawn.tileY * TILE_SIZE + TILE_SIZE / 2;
    this.player = new Player(this, spawnX, spawnY);
    (this.player.sprite.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    this.physics.add.collider(this.player.sprite, layer);

    for (const data of starterDistrictNpcs) {
      const npc = new Npc(this, data);
      this.npcs.push(npc);
      this.physics.add.collider(this.player.sprite, npc.sprite);
    }

    const cam = this.cameras.main;
    cam.startFollow(this.player.sprite, true, 0.18, 0.18);
    cam.setBounds(0, 0, worldWidth, worldHeight);
    cam.setRoundPixels(true);
    cam.setBackgroundColor(0x0f1a14);

    this.controller = new PlayerController(PLAYER_SPEED);
    this.keys = PlayerController.createKeys(this);

    this.prompt = new InteractionPrompt(this);
    this.panel = new InteractionPanel(this);

    this.add
      .text(4, 4, district.name, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#d9c78a',
      })
      .setScrollFactor(0)
      .setDepth(80);

    this.add
      .text(4, 16, 'Move WASD/Arrows  |  Interact E/Space  |  Close Esc', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#8ab07a',
      })
      .setScrollFactor(0)
      .setDepth(80)
      .setAlpha(0.8);
  }

  override update(): void {
    const interactJustPressed =
      Phaser.Input.Keyboard.JustDown(this.keys.interact) ||
      Phaser.Input.Keyboard.JustDown(this.keys.altInteract);
    const cancelJustPressed = Phaser.Input.Keyboard.JustDown(this.keys.cancel);

    if (this.state === 'DIALOGUE') {
      this.controller.update(this.player.sprite, this.keys, true);
      if (interactJustPressed || cancelJustPressed) {
        this.closeDialogue();
      }
      return;
    }

    const facing = this.controller.update(this.player.sprite, this.keys, false);
    if (facing) {
      this.player.facing = facing;
    }

    const nearest = this.findNearestNpcInRange();
    if (nearest) {
      this.prompt.showAbove(nearest.data.id, nearest.sprite.x, nearest.sprite.y);
    } else {
      this.prompt.hide();
    }

    if (interactJustPressed && nearest) {
      this.openDialogue(nearest);
    }
  }

  private openDialogue(npc: Npc): void {
    this.state = 'DIALOGUE';
    this.prompt.hide();
    this.panel.show(npc.data.name, npc.data.role, npc.data.line);
  }

  private closeDialogue(): void {
    this.state = 'EXPLORING';
    this.panel.hide();
  }

  private findNearestNpcInRange(): Npc | null {
    let best: Npc | null = null;
    let bestDist = INTERACT_RADIUS;
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;
    for (const npc of this.npcs) {
      const dist = Math.hypot(npc.sprite.x - px, npc.sprite.y - py);
      if (dist <= bestDist) {
        best = npc;
        bestDist = dist;
      }
    }
    return best;
  }
}
