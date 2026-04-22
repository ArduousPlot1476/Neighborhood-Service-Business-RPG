import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../game/config';
import {
  PROSPECT_STATUS_COLOR,
  PROSPECT_STATUS_LABEL,
  type ProspectStatus,
} from '../../state/prospects';
import type { DialogueViewModel } from '../dialogue/DialogueController';

const PANEL_HEIGHT = 124;
const PANEL_PAD_X = 16;
const PANEL_PAD_BOTTOM = 12;
const TEXT_LEFT_PAD = 12;
const TEXT_TOP_PAD = 10;
const OPTION_LINE_HEIGHT = 12;
const MAX_OPTIONS = 4;

export class InteractionPanel {
  private readonly container: Phaser.GameObjects.Container;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly roleText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly hintText: Phaser.GameObjects.Text;
  private readonly statusBadge: Phaser.GameObjects.Rectangle;
  private readonly statusLabel: Phaser.GameObjects.Text;
  private readonly optionTexts: Phaser.GameObjects.Text[];
  private open = false;
  private optionCount = 0;

  constructor(scene: Phaser.Scene) {
    const w = GAME_WIDTH - PANEL_PAD_X * 2;
    const h = PANEL_HEIGHT;
    const x = GAME_WIDTH / 2;
    const y = GAME_HEIGHT - PANEL_PAD_BOTTOM - h / 2;

    const border = scene.add.rectangle(x, y, w, h, 0xd9c78a, 1);
    const bg = scene.add.rectangle(x, y, w - 2, h - 2, 0x0f1a14, 0.97);
    bg.setStrokeStyle(1, 0x2a3a2a);

    const leftPad = x - w / 2 + TEXT_LEFT_PAD;
    const topPad = y - h / 2 + TEXT_TOP_PAD;

    this.nameText = scene.add.text(leftPad, topPad, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#f4e7b4',
    });
    this.roleText = scene.add.text(leftPad, topPad + 13, '', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#8ab07a',
    });

    this.statusBadge = scene.add.rectangle(x + w / 2 - 10, topPad + 6, 8, 8, 0x8a8575, 1);
    this.statusBadge.setStrokeStyle(1, 0x0f1a14);
    this.statusBadge.setOrigin(1, 0.5);
    this.statusLabel = scene.add
      .text(x + w / 2 - 22, topPad + 2, '', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#cfe9c3',
      })
      .setOrigin(1, 0);

    this.bodyText = scene.add.text(leftPad, topPad + 28, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#cfe9c3',
      wordWrap: { width: w - 24 },
    });
    this.bodyText.setLineSpacing(2);

    this.optionTexts = [];
    const optionsTop = topPad + 60;
    for (let i = 0; i < MAX_OPTIONS; i += 1) {
      const t = scene.add.text(leftPad, optionsTop + i * OPTION_LINE_HEIGHT, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#f4e7b4',
        wordWrap: { width: w - 24 },
      });
      this.optionTexts.push(t);
    }

    this.hintText = scene.add
      .text(x + w / 2 - 12, y + h / 2 - 14, '', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#8ab07a',
      })
      .setOrigin(1, 0);

    this.container = scene.add.container(0, 0, [
      border,
      bg,
      this.nameText,
      this.roleText,
      this.statusBadge,
      this.statusLabel,
      this.bodyText,
      ...this.optionTexts,
      this.hintText,
    ]);
    this.container.setScrollFactor(0);
    this.container.setDepth(100);
    this.container.setVisible(false);
  }

  render(view: DialogueViewModel): void {
    this.nameText.setText(view.speakerName);
    this.roleText.setText(view.speakerRole);
    this.bodyText.setText(view.text);

    this.applyStatus(view.status, view.statusLabel);

    this.optionCount = Math.min(view.options.length, MAX_OPTIONS);
    for (let i = 0; i < MAX_OPTIONS; i += 1) {
      const text = this.optionTexts[i]!;
      if (i < this.optionCount) {
        const opt = view.options[i]!;
        text.setText(`${i + 1}. ${opt.label}`);
        text.setVisible(true);
      } else {
        text.setText('');
        text.setVisible(false);
      }
    }

    this.hintText.setText(this.buildHint(view));

    this.container.setVisible(true);
    this.open = true;
  }

  hide(): void {
    this.container.setVisible(false);
    this.open = false;
    this.optionCount = 0;
  }

  get isOpen(): boolean {
    return this.open;
  }

  get visibleOptionCount(): number {
    return this.optionCount;
  }

  private applyStatus(status: ProspectStatus, label: string): void {
    const color = PROSPECT_STATUS_COLOR[status] ?? PROSPECT_STATUS_COLOR.unknown;
    this.statusBadge.setFillStyle(color, 1);
    const printable = PROSPECT_STATUS_LABEL[status] ?? label;
    this.statusLabel.setText(printable);
  }

  private buildHint(view: DialogueViewModel): string {
    if (view.options.length === 1) {
      return '[1 / E] continue   [Esc] leave';
    }
    const range = view.options.length <= 1 ? '1' : `1-${Math.min(view.options.length, MAX_OPTIONS)}`;
    return `[${range}] choose   [Esc] leave`;
  }
}
