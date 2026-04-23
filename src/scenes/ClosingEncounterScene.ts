import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/config';
import {
  METER_LABEL,
  type EncounterInit,
  type EncounterMeter,
  type EncounterResult,
  type EncounterViewModel,
} from '../systems/closing/closingTypes';
import { ClosingEncounterController } from '../systems/closing/ClosingEncounterController';
import { formatMonthlyValue } from '../state/accounts';

const METERS_ORDER: ReadonlyArray<EncounterMeter> = [
  'interest',
  'trust',
  'budgetFlex',
  'urgency',
  'marginPressure',
  'composure',
];

const METER_BAR_WIDTH = 110;
const METER_ROW_HEIGHT = 14;

export const ENCOUNTER_RESULT_EVENT = 'closing:result';
export const ENCOUNTER_CANCEL_EVENT = 'closing:cancel';

export interface EncounterSceneData {
  readonly init: EncounterInit;
}

export class ClosingEncounterScene extends Phaser.Scene {
  private controller!: ClosingEncounterController;
  private currentInit!: EncounterInit;

  private headerName!: Phaser.GameObjects.Text;
  private headerArchetype!: Phaser.GameObjects.Text;
  private headerTagline!: Phaser.GameObjects.Text;
  private reactionText!: Phaser.GameObjects.Text;
  private turnLabel!: Phaser.GameObjects.Text;

  private meterLabels: Map<EncounterMeter, Phaser.GameObjects.Text> = new Map();
  private meterFills: Map<EncounterMeter, Phaser.GameObjects.Rectangle> = new Map();
  private meterValueText: Map<EncounterMeter, Phaser.GameObjects.Text> = new Map();

  private actionTexts: Phaser.GameObjects.Text[] = [];
  private actionDescTexts: Phaser.GameObjects.Text[] = [];

  private resultContainer!: Phaser.GameObjects.Container;
  private resultTitle!: Phaser.GameObjects.Text;
  private resultBody!: Phaser.GameObjects.Text;
  private resultHint!: Phaser.GameObjects.Text;

  private digitKeys: Phaser.Input.Keyboard.Key[] = [];
  private continueKey!: Phaser.Input.Keyboard.Key;
  private altContinueKey!: Phaser.Input.Keyboard.Key;
  private cancelKey!: Phaser.Input.Keyboard.Key;
  private released = false;

  constructor() {
    super({ key: 'ClosingEncounterScene' });
  }

  init(data: EncounterSceneData): void {
    this.currentInit = data.init;
    this.controller = new ClosingEncounterController();
    this.released = false;
  }

  create(): void {
    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0b1410, 0.96);
    bg.setScrollFactor(0);
    bg.setDepth(0);

    this.buildHeader();
    this.buildMeters();
    this.buildReactionPanel();
    this.buildActionPanel();
    this.buildResultOverlay();
    this.bindKeys();

    const view = this.controller.start(this.currentInit);
    this.render(view);
  }

  override update(): void {
    if (!this.controller) return;

    if (this.controller.isActive()) {
      const idx = this.firstJustPressedDigit();
      if (idx !== null) {
        const view = this.controller.selectAction(idx);
        this.render(view);
      } else if (Phaser.Input.Keyboard.JustDown(this.cancelKey)) {
        const view = this.controller.walkAway();
        this.render(view);
      }
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.continueKey) || Phaser.Input.Keyboard.JustDown(this.altContinueKey)) {
      this.complete();
    }
  }

  private buildHeader(): void {
    const top = 16;
    this.headerName = this.add
      .text(16, top, '', { fontFamily: 'monospace', fontSize: '12px', color: '#f4e7b4' })
      .setScrollFactor(0)
      .setDepth(10);
    this.headerArchetype = this.add
      .text(16, top + 14, '', { fontFamily: 'monospace', fontSize: '10px', color: '#cfe9c3' })
      .setScrollFactor(0)
      .setDepth(10);
    this.headerTagline = this.add
      .text(16, top + 26, '', { fontFamily: 'monospace', fontSize: '9px', color: '#8ab07a' })
      .setScrollFactor(0)
      .setDepth(10);

    this.turnLabel = this.add
      .text(GAME_WIDTH - 16, top, '', { fontFamily: 'monospace', fontSize: '10px', color: '#d9c78a' })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(10);
    this.add
      .text(GAME_WIDTH - 16, top + 14, 'Choose 1-5    Esc walks away', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#8ab07a',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(10);
  }

  private buildMeters(): void {
    const startX = 16;
    const startY = 64;
    const labelWidth = 88;
    METERS_ORDER.forEach((meter, i) => {
      const y = startY + i * METER_ROW_HEIGHT;
      const label = this.add
        .text(startX, y, METER_LABEL[meter], {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#cfe9c3',
        })
        .setScrollFactor(0)
        .setDepth(10);
      this.meterLabels.set(meter, label);

      const trackX = startX + labelWidth;
      const track = this.add.rectangle(trackX, y + 4, METER_BAR_WIDTH, 6, 0x1f2a22, 1);
      track.setOrigin(0, 0);
      track.setStrokeStyle(1, 0x2a3a2a);
      track.setScrollFactor(0);
      track.setDepth(10);

      const fill = this.add.rectangle(trackX, y + 4, METER_BAR_WIDTH, 6, this.meterColor(meter), 1);
      fill.setOrigin(0, 0);
      fill.setScrollFactor(0);
      fill.setDepth(11);
      this.meterFills.set(meter, fill);

      const value = this.add
        .text(trackX + METER_BAR_WIDTH + 6, y, '', {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#d9c78a',
        })
        .setScrollFactor(0)
        .setDepth(10);
      this.meterValueText.set(meter, value);
    });
  }

  private buildReactionPanel(): void {
    const x = 260;
    const y = 64;
    const w = GAME_WIDTH - x - 16;
    const h = METERS_ORDER.length * METER_ROW_HEIGHT;
    const border = this.add.rectangle(x, y, w, h, 0xd9c78a, 1).setOrigin(0, 0);
    const bg = this.add.rectangle(x + 1, y + 1, w - 2, h - 2, 0x101a14, 0.95).setOrigin(0, 0);
    bg.setStrokeStyle(1, 0x2a3a2a);
    border.setScrollFactor(0).setDepth(10);
    bg.setScrollFactor(0).setDepth(10);

    this.reactionText = this.add
      .text(x + 10, y + 10, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#f4e7b4',
        wordWrap: { width: w - 20 },
      })
      .setScrollFactor(0)
      .setDepth(11);
    this.reactionText.setLineSpacing(2);
  }

  private buildActionPanel(): void {
    const top = 168;
    const left = 16;
    const right = GAME_WIDTH - 16;
    const w = right - left;
    const h = GAME_HEIGHT - top - 12;

    const border = this.add.rectangle(left, top, w, h, 0xd9c78a, 1).setOrigin(0, 0);
    const bg = this.add.rectangle(left + 1, top + 1, w - 2, h - 2, 0x0f1a14, 0.97).setOrigin(0, 0);
    bg.setStrokeStyle(1, 0x2a3a2a);
    border.setScrollFactor(0).setDepth(10);
    bg.setScrollFactor(0).setDepth(10);

    const headerText = this.add
      .text(left + 10, top + 8, 'Negotiation actions', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#8ab07a',
      })
      .setScrollFactor(0)
      .setDepth(11);
    headerText.setAlpha(0.85);

    const rowTop = top + 24;
    const rowHeight = 26;
    for (let i = 0; i < 5; i += 1) {
      const labelText = this.add
        .text(left + 10, rowTop + i * rowHeight, '', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#f4e7b4',
        })
        .setScrollFactor(0)
        .setDepth(11);
      const descText = this.add
        .text(left + 10, rowTop + i * rowHeight + 12, '', {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#cfe9c3',
          wordWrap: { width: w - 24 },
        })
        .setScrollFactor(0)
        .setDepth(11);
      descText.setAlpha(0.85);
      this.actionTexts.push(labelText);
      this.actionDescTexts.push(descText);
    }
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
      .text(x, y - 6, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#cfe9c3',
        align: 'center',
        wordWrap: { width: w - 28 },
      })
      .setOrigin(0.5, 0.5);
    this.resultBody.setLineSpacing(3);
    this.resultHint = this.add
      .text(x, y + h / 2 - 16, '[E / Space] return to district', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#8ab07a',
      })
      .setOrigin(0.5, 0);

    this.resultContainer = this.add.container(0, 0, [dim, border, bg, this.resultTitle, this.resultBody, this.resultHint]);
    this.resultContainer.setScrollFactor(0);
    this.resultContainer.setDepth(50);
    this.resultContainer.setVisible(false);
  }

  private bindKeys(): void {
    const kb = this.input.keyboard;
    if (!kb) throw new Error('ClosingEncounterScene: keyboard plugin unavailable.');
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.digitKeys = [
      kb.addKey(K.ONE),
      kb.addKey(K.TWO),
      kb.addKey(K.THREE),
      kb.addKey(K.FOUR),
      kb.addKey(K.FIVE),
    ];
    this.continueKey = kb.addKey(K.E);
    this.altContinueKey = kb.addKey(K.SPACE);
    this.cancelKey = kb.addKey(K.ESC);
  }

  private firstJustPressedDigit(): number | null {
    for (let i = 0; i < this.digitKeys.length; i += 1) {
      const key = this.digitKeys[i]!;
      if (Phaser.Input.Keyboard.JustDown(key)) return i;
    }
    return null;
  }

  private render(view: EncounterViewModel): void {
    this.headerName.setText(`${view.npcName}  —  ${view.npcRole}`);
    this.headerArchetype.setText(view.archetypeName);
    this.headerTagline.setText(view.archetypeTagline);
    this.turnLabel.setText(`Turn ${view.turn}`);
    this.reactionText.setText(view.reactionLine);

    for (const meter of METERS_ORDER) {
      const fill = this.meterFills.get(meter)!;
      const value = this.meterValueText.get(meter)!;
      const v = Math.max(0, Math.min(100, view.meters[meter]));
      fill.width = (METER_BAR_WIDTH * v) / 100;
      value.setText(String(Math.round(v)));
    }

    for (let i = 0; i < this.actionTexts.length; i += 1) {
      const opt = view.options[i];
      const labelText = this.actionTexts[i]!;
      const descText = this.actionDescTexts[i]!;
      if (!opt) {
        labelText.setText('');
        descText.setText('');
        continue;
      }
      labelText.setText(`${opt.index + 1}. ${opt.label}`);
      descText.setText(opt.description);
    }

    if (view.resolved) {
      this.showResult(view);
    }
  }

  private showResult(view: EncounterViewModel): void {
    const result = this.controller.result();
    if (!result) return;
    const title = result.outcome === 'win' ? 'Deal won' : result.outcome === 'lose' ? 'Deal lost' : 'Deferred';
    this.resultTitle.setColor(this.outcomeColor(result.outcome));
    this.resultTitle.setText(title);
    const lines: string[] = [view.reactionLine, ''];
    if (result.outcome === 'win') {
      lines.push(`Plan: ${result.plan.replace(/_/g, ' ')}`);
      lines.push(`Agreed: ${formatMonthlyValue(result.priceCents)}`);
    } else {
      lines.push(`Final reads — Trust ${Math.round(result.meters.trust)} / Interest ${Math.round(result.meters.interest)} / Budget ${Math.round(result.meters.budgetFlex)}`);
    }
    lines.push(`Turns used: ${result.turnsUsed}`);
    this.resultBody.setText(lines.join('\n'));
    this.resultContainer.setVisible(true);
  }

  private complete(): void {
    if (this.released) return;
    const result = this.controller.result();
    if (!result) return;
    this.released = true;
    const payload: EncounterCompletionPayload = { npcId: this.currentInit.npcId, result };
    this.events.emit(ENCOUNTER_RESULT_EVENT, payload);
    this.controller.reset();
    this.scene.stop();
  }

  private outcomeColor(outcome: EncounterResult['outcome']): string {
    switch (outcome) {
      case 'win':
        return '#7fd49b';
      case 'lose':
        return '#e08a85';
      case 'defer':
        return '#f0c878';
    }
  }

  private meterColor(meter: EncounterMeter): number {
    switch (meter) {
      case 'interest':
        return 0x6aa8d9;
      case 'trust':
        return 0x6ec27a;
      case 'budgetFlex':
        return 0xe6b84a;
      case 'urgency':
        return 0xc25450;
      case 'marginPressure':
        return 0xb56ad9;
      case 'composure':
        return 0xd9c78a;
    }
  }
}

export interface EncounterCompletionPayload {
  readonly npcId: string;
  readonly result: EncounterResult;
}
