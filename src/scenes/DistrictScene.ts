import Phaser from 'phaser';
import { TILE_SIZE } from '../game/config';
import { Player } from '../entities/Player';
import { Npc } from '../entities/Npc';
import { PlayerController, type InputKeys } from '../systems/input/PlayerController';
import { InteractionPrompt } from '../systems/interactions/InteractionPrompt';
import { InteractionPanel } from '../systems/interactions/InteractionPanel';
import { StatusToast } from '../systems/interactions/StatusToast';
import { DialogueController } from '../systems/dialogue/DialogueController';
import { getDialogueGraph } from '../content/dialogue/starterDistrictDialogue';
import { starterDistrict } from '../content/districts/starterDistrict';
import { starterDistrictNpcs } from '../content/npcs/starterDistrictNpcs';
import { starterDistrictProspects } from '../content/prospects/starterDistrictProspects';
import { GameState } from '../state/GameState';
import { PROSPECT_STATUS_LABEL } from '../state/prospects';
import { SOLID_TILE_INDICES, TILESET_KEY } from './PreloadScene';
import type { SceneState } from '../types';

const INTERACT_RADIUS = TILE_SIZE * 1.4;
const PLAYER_SPEED = 110;

export class DistrictScene extends Phaser.Scene {
  private player!: Player;
  private controller!: PlayerController;
  private keys!: InputKeys;
  private npcs: Npc[] = [];
  private npcsById = new Map<string, Npc>();
  private prompt!: InteractionPrompt;
  private panel!: InteractionPanel;
  private toast!: StatusToast;
  private gameState!: GameState;
  private dialogue!: DialogueController;
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

    this.gameState = new GameState();
    for (const seed of starterDistrictProspects) {
      this.gameState.registerProspect(seed.npcId);
    }

    for (const data of starterDistrictNpcs) {
      const npc = new Npc(this, data);
      this.npcs.push(npc);
      this.npcsById.set(data.id, npc);
      this.physics.add.collider(this.player.sprite, npc.sprite);
      npc.setStatus(this.gameState.getProspectStatus(data.id));
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
    this.toast = new StatusToast(this);

    this.dialogue = new DialogueController(this.gameState);
    this.dialogue.onEnd(() => {
      this.panel.hide();
      this.state = 'EXPLORING';
    });

    this.gameState.on((change) => {
      if (change.type !== 'prospectStatusChanged') return;
      const npc = this.npcsById.get(change.npcId);
      if (!npc) return;
      npc.setStatus(change.next);
      this.toast.show(npc.data.name, change.next);
    });

    this.add
      .text(4, 4, district.name, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#d9c78a',
      })
      .setScrollFactor(0)
      .setDepth(80);

    this.add
      .text(4, 16, 'Move WASD/Arrows  |  Talk E/Space  |  Choose 1-4  |  Leave Esc', {
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

      if (cancelJustPressed) {
        this.dialogue.cancel();
        return;
      }

      const digitIndex = this.firstJustPressedDigit();
      if (digitIndex !== null) {
        this.advanceDialogue(digitIndex);
        return;
      }

      if (interactJustPressed && this.panel.visibleOptionCount === 1) {
        this.advanceDialogue(0);
      }
      return;
    }

    const facing = this.controller.update(this.player.sprite, this.keys, false);
    if (facing) {
      this.player.facing = facing;
    }

    const nearest = this.findNearestNpcInRange();
    if (nearest) {
      this.prompt.showAbove(
        nearest.data.id,
        nearest.sprite.x,
        nearest.sprite.y,
        this.promptLabelFor(nearest),
      );
    } else {
      this.prompt.hide();
    }

    if (interactJustPressed && nearest) {
      this.openDialogue(nearest);
    }
  }

  private openDialogue(npc: Npc): void {
    const graph = getDialogueGraph(npc.data.dialogueId);
    if (!graph) {
      return;
    }
    this.state = 'DIALOGUE';
    this.prompt.hide();
    const view = this.dialogue.start({
      npcId: npc.data.id,
      npcName: npc.data.name,
      npcRole: npc.data.role,
      graph,
    });
    this.panel.render(view);
  }

  private advanceDialogue(index: number): void {
    const next = this.dialogue.selectOption(index);
    if (next) {
      this.panel.render(next);
    }
  }

  private firstJustPressedDigit(): number | null {
    for (let i = 0; i < this.keys.digits.length; i += 1) {
      const key = this.keys.digits[i]!;
      if (Phaser.Input.Keyboard.JustDown(key)) {
        return i;
      }
    }
    return null;
  }

  private promptLabelFor(npc: Npc): string {
    const status = this.gameState.getProspectStatus(npc.data.id);
    if (status === 'unknown') return '[E] Talk';
    return `[E] ${PROSPECT_STATUS_LABEL[status]}`;
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
