import Phaser from 'phaser';

export class InteractionPrompt {
  private readonly container: Phaser.GameObjects.Container;
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private targetId: string | null = null;

  constructor(scene: Phaser.Scene) {
    this.bg = scene.add.rectangle(0, 0, 56, 14, 0x101a14, 0.92);
    this.bg.setStrokeStyle(1, 0xd9c78a);
    this.label = scene.add
      .text(0, -1, '[E] Talk', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#f4e7b4',
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
