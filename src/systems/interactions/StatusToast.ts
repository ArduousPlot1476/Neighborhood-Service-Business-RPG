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
    const w = 240;
    const h = 22;
    const x = GAME_WIDTH / 2;
    const y = 26;

    this.border = scene.add.rectangle(x, y, w, h, 0xa48748, 1);
    this.bg = scene.add.rectangle(x, y, w - 2, h - 2, 0xf4e9d0, 0.97);
    this.bg.setStrokeStyle(1, 0xc8b27e);
    this.swatch = scene.add.rectangle(x - w / 2 + 10, y, 6, 6, 0x6e6a64, 1);
    this.swatch.setStrokeStyle(1, 0x1a1410);
    this.text = scene.add
      .text(x - w / 2 + 22, y, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#1a1410',
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
    this.showRaw(`${npcName} — ${PROSPECT_STATUS_LABEL[status]}`, PROSPECT_STATUS_COLOR[status]);
  }

  showRaw(message: string, color: number): void {
    this.swatch.setFillStyle(color, 1);
    this.text.setText(message);

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
