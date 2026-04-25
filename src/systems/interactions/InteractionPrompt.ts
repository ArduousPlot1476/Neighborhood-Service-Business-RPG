import Phaser from 'phaser';

export class InteractionPrompt {
  private readonly container: Phaser.GameObjects.Container;
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private targetId: string | null = null;

  constructor(scene: Phaser.Scene) {
    this.bg = scene.add.rectangle(0, 0, 56, 14, 0xf4e9d0, 0.95);
    this.bg.setStrokeStyle(1, 0xa48748);
    this.label = scene.add
      .text(0, -1, '[E] Talk', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#1a1410',
      })
      .setOrigin(0.5);

    this.container = scene.add.container(0, 0, [this.bg, this.label]);
    this.container.setDepth(50);
    this.container.setVisible(false);
  }

  showAbove(id: string, worldX: number, worldY: number, label = '[E] Talk'): void {
    if (this.label.text !== label) {
      this.label.setText(label);
      const padded = Math.max(48, this.label.width + 12);
      this.bg.setSize(padded, 14);
    }
    this.targetId = id;
    this.container.setPosition(Math.round(worldX), Math.round(worldY - 16));
    this.container.setVisible(true);
  }

  hide(): void {
    if (!this.container.visible) return;
    this.targetId = null;
    this.container.setVisible(false);
  }

  get current(): string | null {
    return this.targetId;
  }
}
