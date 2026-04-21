import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../game/config';

export class InteractionPanel {
  private readonly container: Phaser.GameObjects.Container;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly roleText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private open = false;

  constructor(scene: Phaser.Scene) {
    const padX = 16;
    const padBottom = 12;
    const w = GAME_WIDTH - padX * 2;
    const h = 76;
    const x = GAME_WIDTH / 2;
    const y = GAME_HEIGHT - padBottom - h / 2;

    const border = scene.add.rectangle(x, y, w, h, 0xd9c78a, 1);
    const bg = scene.add.rectangle(x, y, w - 2, h - 2, 0x0f1a14, 0.97);
    bg.setStrokeStyle(1, 0x2a3a2a);

    const leftPad = x - w / 2 + 12;
    const topPad = y - h / 2 + 10;

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
    this.bodyText = scene.add.text(leftPad, topPad + 28, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#cfe9c3',
      wordWrap: { width: w - 24 },
    });
    this.bodyText.setLineSpacing(3);

    const hint = scene.add
      .text(x + w / 2 - 12, y + h / 2 - 14, '[E] continue  [Esc] close', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#8ab07a',
      })
      .setOrigin(1, 0);

    this.container = scene.add.container(0, 0, [border, bg, this.nameText, this.roleText, this.bodyText, hint]);
    this.container.setScrollFactor(0);
    this.container.setDepth(100);
    this.container.setVisible(false);
  }

  show(name: string, role: string, line: string): void {
    this.nameText.setText(name);
    this.roleText.setText(role);
    this.bodyText.setText(line);
    this.container.setVisible(true);
    this.open = true;
  }

  hide(): void {
    this.container.setVisible(false);
    this.open = false;
  }

  get isOpen(): boolean {
    return this.open;
  }
}
