import Phaser from 'phaser';
import { GAME_WIDTH } from '../../game/config';
import {
  PROSPECT_STATUS_COLOR,
  PROSPECT_STATUS_LABEL,
  type ProspectStatus,
} from '../../state/prospects';

const TOAST_DURATION_MS = 2200;
const TOAST_FADE_MS = 350;

export class StatusToast {
  private readonly scene: Phaser.Scene;
  private readonly container: Phaser.GameObjects.Container;
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly border: Phaser.GameObjects.Rectangle;
  private readonly swatch: Phaser.GameObjects.Rectangle;
  private readonly text: Phaser.GameObjects.Text;
  private hideEvent: Phaser.Time.TimerEvent | null = null;
  private fadeTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const w = 220;
    const h = 22;
    const x = GAME_WIDTH / 2;
    const y = 26;

    this.border = scene.add.rectangle(x, y, w, h, 0xd9c78a, 1);
    this.bg = scene.add.rectangle(x, y, w - 2, h - 2, 0x0f1a14, 0.95);
    this.bg.setStrokeStyle(1, 0x2a3a2a);
    this.swatch = scene.add.rectangle(x - w / 2 + 10, y, 6, 6, 0x8a8575, 1);
    this.swatch.setStrokeStyle(1, 0x0f1a14);
    this.text = scene.add
      .text(x - w / 2 + 22, y, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#f4e7b4',
      })
      .setOrigin(0, 0.5);

    this.container = scene.add.container(0, 0, [this.border, this.bg, this.swatch, this.text]);
    this.container.setScrollFactor(0);
    this.container.setDepth(110);
    this.container.setVisible(false);
    this.container.setAlpha(0);
  }

  show(npcName: string, status: ProspectStatus): void {
    if (status === 'unknown') return;
    const label = PROSPECT_STATUS_LABEL[status];
    const color = PROSPECT_STATUS_COLOR[status];
    this.swatch.setFillStyle(color, 1);
    this.text.setText(`${npcName} — ${label}`);

    this.cancelTimers();
    this.container.setVisible(true);
    this.container.setAlpha(1);

    this.hideEvent = this.scene.time.delayedCall(TOAST_DURATION_MS, () => this.fadeOut());
  }

  private fadeOut(): void {
    this.fadeTween = this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: TOAST_FADE_MS,
      onComplete: () => {
        this.container.setVisible(false);
        this.fadeTween = null;
      },
    });
  }

  private cancelTimers(): void {
    if (this.hideEvent) {
      this.hideEvent.remove(false);
      this.hideEvent = null;
    }
    if (this.fadeTween) {
      this.fadeTween.stop();
      this.fadeTween = null;
    }
  }
}
