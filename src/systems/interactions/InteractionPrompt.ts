import Phaser from 'phaser';

export class InteractionPrompt {
  private readonly container: Phaser.GameObjects.Container;
  private targetId: string | null = null;

  constructor(scene: Phaser.Scene) {
    const bg = scene.add.rectangle(0, 0, 46, 14, 0x101a14, 0.92);
    bg.setStrokeStyle(1, 0xd9c78a);
    const label = scene.add
      .text(0, -1, '[E] Talk', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#f4e7b4',
      })
      .setOrigin(0.5);

    this.container = scene.add.container(0, 0, [bg, label]);
    this.container.setDepth(50);
    this.container.setVisible(false);
  }

  showAbove(id: string, worldX: number, worldY: number): void {
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
