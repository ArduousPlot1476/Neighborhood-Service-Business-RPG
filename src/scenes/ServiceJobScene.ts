import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE } from '../game/config';
import { ServiceJobController } from '../systems/service/ServiceJobController';
import type {
  ServiceJobInit,
  ServiceJobResult,
  ServiceJobViewModel,
} from '../systems/service/serviceJobTypes';
import { ZONE_BASE_COLOR, ZONE_DONE_COLOR, type YardZone } from '../content/jobs/starterJobs';
import { formatDollars } from '../state/accounts';
import { JOB_QUALITY_LABEL } from '../state/jobs';
import { PERSON_KEY } from './PreloadScene';

export const SERVICE_JOB_RESULT_EVENT = 'service:result';
export const SERVICE_JOB_ABANDON_EVENT = 'service:abandon';

export interface ServiceJobSceneData {
  readonly init: ServiceJobInit;
}

export interface ServiceJobCompletionPayload {
  readonly jobId: string;
  readonly result: ServiceJobResult;
}

const PLAYER_SPEED = 95;
const YARD_OFFSET_Y = 40;

export class ServiceJobScene extends Phaser.Scene {
  private controller!: ServiceJobController;
  private currentInit!: ServiceJobInit;

  private player!: Phaser.GameObjects.Sprite;
  private zoneSprites: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private zoneLabels: Map<string, Phaser.GameObjects.Text> = new Map();
  private zoneProgressBars: Map<string, Phaser.GameObjects.Rectangle> = new Map();

  private titleText!: Phaser.GameObjects.Text;
  private serviceLabelText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private timerBarFill!: Phaser.GameObjects.Rectangle;
  private timerBarMaxWidth = 0;
  private zonesText!: Phaser.GameObjects.Text;
  private projectedText!: Phaser.GameObjects.Text;
  private currentZoneText!: Phaser.GameObjects.Text;

  private resultContainer!: Phaser.GameObjects.Container;
  private resultTitle!: Phaser.GameObjects.Text;
  private resultBody!: Phaser.GameObjects.Text;

  private upKey!: Phaser.Input.Keyboard.Key;
  private downKey!: Phaser.Input.Keyboard.Key;
  private leftKey!: Phaser.Input.Keyboard.Key;
  private rightKey!: Phaser.Input.Keyboard.Key;
  private altUpKey!: Phaser.Input.Keyboard.Key;
  private altDownKey!: Phaser.Input.Keyboard.Key;
  private altLeftKey!: Phaser.Input.Keyboard.Key;
  private altRightKey!: Phaser.Input.Keyboard.Key;
  private serviceKey!: Phaser.Input.Keyboard.Key;
  private continueKey!: Phaser.Input.Keyboard.Key;
  private altContinueKey!: Phaser.Input.Keyboard.Key;
  private cancelKey!: Phaser.Input.Keyboard.Key;

  private released = false;
  private yardOriginX = 0;
  private yardWidthPx = 0;
  private yardHeightPx = 0;

  constructor() {
    super({ key: 'ServiceJobScene' });
  }

  init(data: ServiceJobSceneData): void {
    this.currentInit = data.init;
    this.controller = new ServiceJobController();
    this.released = false;
    this.zoneSprites.clear();
    this.zoneLabels.clear();
    this.zoneProgressBars.clear();
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x0b1410);

    this.buildHud();
    this.buildYard();
    this.buildResultOverlay();
    this.bindKeys();

    const view = this.controller.start(this.currentInit);
    this.render(view);
  }

  override update(_time: number, deltaMs: number): void {
    if (!this.controller) return;

    if (this.controller.isActive()) {
      const dt = deltaMs / 1000;
      this.applyMovement(dt);
      const activeZoneId = this.zoneUnderPlayer();
      const isServicing = this.serviceKey.isDown && activeZoneId !== null;
      const view = this.controller.tick({
        deltaSeconds: dt,
        activeZoneId,
        isServicing,
      });
      if (Phaser.Input.Keyboard.JustDown(this.cancelKey)) {
        const finished = this.controller.forceFinish();
        this.render(finished);
        return;
      }
      this.render(view);
      return;
    }

    if (
      Phaser.Input.Keyboard.JustDown(this.continueKey) ||
      Phaser.Input.Keyboard.JustDown(this.altContinueKey)
    ) {
      this.complete();
    }
  }

  private buildHud(): void {
    this.titleText = this.add
      .text(16, 6, '', { fontFamily: 'monospace', fontSize: '11px', color: '#f4e7b4' })
      .setDepth(10);
    this.serviceLabelText = this.add
      .text(16, 19, '', { fontFamily: 'monospace', fontSize: '9px', color: '#8ab07a' })
      .setDepth(10);

    this.zonesText = this.add
      .text(GAME_WIDTH - 16, 6, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#cfe9c3',
      })
      .setOrigin(1, 0)
      .setDepth(10);
    this.projectedText = this.add
      .text(GAME_WIDTH - 16, 19, '', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#d9c78a',
      })
      .setOrigin(1, 0)
      .setDepth(10);

    this.timerBarMaxWidth = 220;
    const timerX = GAME_WIDTH / 2 - this.timerBarMaxWidth / 2;
    const timerY = 26;
    const trackBg = this.add.rectangle(timerX, timerY, this.timerBarMaxWidth, 6, 0x1f2a22, 1);
    trackBg.setOrigin(0, 0).setStrokeStyle(1, 0x2a3a2a).setDepth(10);
    this.timerBarFill = this.add.rectangle(
      timerX,
      timerY,
      this.timerBarMaxWidth,
      6,
      0xe6b84a,
      1,
    );
    this.timerBarFill.setOrigin(0, 0).setDepth(11);
    this.timerText = this.add
      .text(GAME_WIDTH / 2, 14, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#d9c78a',
      })
      .setOrigin(0.5, 0)
      .setDepth(10);

    this.currentZoneText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 26, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#cfe9c3',
      })
      .setOrigin(0.5, 0)
      .setDepth(10);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 14, 'WASD move    Hold E to service    Esc finish early', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#8ab07a',
      })
      .setOrigin(0.5, 0)
      .setDepth(10);
  }

  private buildYard(): void {
    const layout = this.currentInit.layout;
    this.yardWidthPx = layout.widthTiles * TILE_SIZE;
    this.yardHeightPx = layout.heightTiles * TILE_SIZE;
    this.yardOriginX = GAME_WIDTH / 2 - this.yardWidthPx / 2;
    const originY = YARD_OFFSET_Y;

    const grass = this.add.rectangle(
      this.yardOriginX,
      originY,
      this.yardWidthPx,
      this.yardHeightPx,
      0x446b2a,
      1,
    );
    grass.setOrigin(0, 0).setDepth(0);
    grass.setStrokeStyle(1, 0x2f5120);

    for (const zone of layout.zones) {
      const zx = this.yardOriginX + zone.tileX * TILE_SIZE;
      const zy = originY + zone.tileY * TILE_SIZE;
      const zw = zone.widthTiles * TILE_SIZE;
      const zh = zone.heightTiles * TILE_SIZE;
      const sprite = this.add.rectangle(zx, zy, zw, zh, ZONE_BASE_COLOR[zone.kind], 0.85);
      sprite.setOrigin(0, 0).setDepth(1);
      sprite.setStrokeStyle(1, 0x0f1a14);
      this.zoneSprites.set(zone.id, sprite);

      const label = this.add
        .text(zx + zw / 2, zy + zh / 2, zone.label, {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#0f1a14',
        })
        .setOrigin(0.5, 0.5)
        .setDepth(2);
      this.zoneLabels.set(zone.id, label);

      const progressBar = this.add.rectangle(zx + 2, zy + zh - 4, zw - 4, 2, 0xf4e7b4, 1);
      progressBar.setOrigin(0, 0).setDepth(2);
      progressBar.setVisible(false);
      this.zoneProgressBars.set(zone.id, progressBar);
    }

    const spawn = layout.playerSpawn;
    const px = this.yardOriginX + spawn.tileX * TILE_SIZE + TILE_SIZE / 2;
    const py = originY + spawn.tileY * TILE_SIZE + TILE_SIZE / 2;
    this.player = this.add.sprite(px, py, PERSON_KEY);
    this.player.setDepth(5);
    this.player.setTint(0xffffff);
  }

  private buildResultOverlay(): void {
    const w = 360;
    const h = 160;
    const x = GAME_WIDTH / 2;
    const y = GAME_HEIGHT / 2;
    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55);
    const border = this.add.rectangle(x, y, w, h, 0xd9c78a, 1);
    const bg = this.add.rectangle(x, y, w - 2, h - 2, 0x0f1a14, 0.98);
    bg.setStrokeStyle(1, 0x2a3a2a);

    this.resultTitle = this.add
      .text(x, y - h / 2 + 14, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#f4e7b4',
      })
      .setOrigin(0.5, 0);
    this.resultBody = this.add
      .text(x, y - 8, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#cfe9c3',
        align: 'center',
        wordWrap: { width: w - 28 },
      })
      .setOrigin(0.5, 0.5);
    this.resultBody.setLineSpacing(3);
    const hint = this.add
      .text(x, y + h / 2 - 16, '[E / Space] return to district', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#8ab07a',
      })
      .setOrigin(0.5, 0);

    this.resultContainer = this.add.container(0, 0, [dim, border, bg, this.resultTitle, this.resultBody, hint]);
    this.resultContainer.setDepth(50);
    this.resultContainer.setVisible(false);
  }

  private bindKeys(): void {
    const kb = this.input.keyboard;
    if (!kb) throw new Error('ServiceJobScene: keyboard plugin unavailable.');
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.upKey = kb.addKey(K.W);
    this.downKey = kb.addKey(K.S);
    this.leftKey = kb.addKey(K.A);
    this.rightKey = kb.addKey(K.D);
    this.altUpKey = kb.addKey(K.UP);
    this.altDownKey = kb.addKey(K.DOWN);
    this.altLeftKey = kb.addKey(K.LEFT);
    this.altRightKey = kb.addKey(K.RIGHT);
    this.serviceKey = kb.addKey(K.E);
    this.continueKey = kb.addKey(K.E);
    this.altContinueKey = kb.addKey(K.SPACE);
    this.cancelKey = kb.addKey(K.ESC);
  }

  private applyMovement(dt: number): void {
    const left = this.leftKey.isDown || this.altLeftKey.isDown;
    const right = this.rightKey.isDown || this.altRightKey.isDown;
    const up = this.upKey.isDown || this.altUpKey.isDown;
    const down = this.downKey.isDown || this.altDownKey.isDown;

    let vx = 0;
    let vy = 0;
    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;
    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      vx = (vx / len) * PLAYER_SPEED;
      vy = (vy / len) * PLAYER_SPEED;
    }

    const minX = this.yardOriginX + 4;
    const maxX = this.yardOriginX + this.yardWidthPx - 4;
    const minY = YARD_OFFSET_Y + 4;
    const maxY = YARD_OFFSET_Y + this.yardHeightPx - 4;

    const nextX = Phaser.Math.Clamp(this.player.x + vx * dt, minX, maxX);
    const nextY = Phaser.Math.Clamp(this.player.y + vy * dt, minY, maxY);
    this.player.setPosition(Math.round(nextX), Math.round(nextY));
  }

  private zoneUnderPlayer(): string | null {
    const px = this.player.x;
    const py = this.player.y;
    for (const zone of this.currentInit.layout.zones) {
      if (this.zoneContains(zone, px, py)) return zone.id;
    }
    return null;
  }

  private zoneContains(zone: YardZone, x: number, y: number): boolean {
    const zx = this.yardOriginX + zone.tileX * TILE_SIZE;
    const zy = YARD_OFFSET_Y + zone.tileY * TILE_SIZE;
    const zw = zone.widthTiles * TILE_SIZE;
    const zh = zone.heightTiles * TILE_SIZE;
    return x >= zx && x <= zx + zw && y >= zy && y <= zy + zh;
  }

  private render(view: ServiceJobViewModel): void {
    this.titleText.setText(view.title);
    this.serviceLabelText.setText(view.serviceLabel);
    this.zonesText.setText(`Zones ${view.zonesDone}/${view.zonesTotal}`);
    this.projectedText.setText(`Projected: ${formatDollars(view.projectedPayoutCents)} of ${formatDollars(view.basePayoutCents)}`);

    const remaining = Math.max(0, view.timerRemainingSeconds);
    this.timerText.setText(`${remaining.toFixed(1)}s`);
    const fillRatio = view.timerTotalSeconds > 0 ? remaining / view.timerTotalSeconds : 0;
    this.timerBarFill.width = this.timerBarMaxWidth * fillRatio;
    this.timerBarFill.setFillStyle(this.timerColor(fillRatio), 1);

    const zonesSnapshot = this.controller.zonesSnapshot();
    for (const runtime of zonesSnapshot) {
      const sprite = this.zoneSprites.get(runtime.zone.id);
      const bar = this.zoneProgressBars.get(runtime.zone.id);
      const label = this.zoneLabels.get(runtime.zone.id);
      if (!sprite || !bar || !label) continue;
      if (runtime.state === 'done') {
        sprite.setFillStyle(ZONE_DONE_COLOR[runtime.zone.kind], 1);
        bar.setVisible(false);
        label.setColor('#0f1a14');
      } else if (runtime.state === 'in_progress') {
        sprite.setFillStyle(ZONE_BASE_COLOR[runtime.zone.kind], 0.95);
        const ratio = runtime.progressSeconds / runtime.zone.secondsToService;
        bar.width = (runtime.zone.widthTiles * TILE_SIZE - 4) * ratio;
        bar.setVisible(true);
      } else {
        sprite.setFillStyle(ZONE_BASE_COLOR[runtime.zone.kind], 0.85);
        bar.setVisible(false);
      }
    }

    if (view.currentZoneId) {
      const zone = this.currentInit.layout.zones.find((z) => z.id === view.currentZoneId);
      if (zone) {
        const pct = Math.round(view.currentZoneProgress * 100);
        this.currentZoneText.setText(`At ${zone.label} — hold E (${pct}%)`);
      }
    } else {
      this.currentZoneText.setText('Stand on a coloured zone, then hold E.');
    }

    if (view.resolved) {
      this.showResult(view);
    }
  }

  private showResult(view: ServiceJobViewModel): void {
    const result = this.controller.result();
    if (!result) return;
    const headline = result.outcome === 'completed' ? 'Job complete' : 'Did not finish';
    this.resultTitle.setColor(result.outcome === 'completed' ? '#7fd49b' : '#e08a85');
    this.resultTitle.setText(headline);
    const lines: string[] = [
      `Quality: ${JOB_QUALITY_LABEL[result.qualityLabel]} (${Math.round(result.qualityScore * 100)}%)`,
      `Zones cleared: ${result.zonesCleared} / ${result.zonesTotal}`,
      `Time used: ${result.secondsUsed.toFixed(1)}s of ${view.timerTotalSeconds.toFixed(0)}s`,
      `Payout: ${formatDollars(result.payoutCents)} (base ${formatDollars(view.basePayoutCents)})`,
    ];
    this.resultBody.setText(lines.join('\n'));
    this.resultContainer.setVisible(true);
  }

  private timerColor(ratio: number): number {
    if (ratio > 0.5) return 0xe6b84a;
    if (ratio > 0.2) return 0xc28a40;
    return 0xc25450;
  }

  private complete(): void {
    if (this.released) return;
    const result = this.controller.result();
    if (!result) return;
    this.released = true;
    const payload: ServiceJobCompletionPayload = { jobId: this.currentInit.jobId, result };
    this.events.emit(SERVICE_JOB_RESULT_EVENT, payload);
    this.controller.reset();
    this.scene.stop();
  }
}
