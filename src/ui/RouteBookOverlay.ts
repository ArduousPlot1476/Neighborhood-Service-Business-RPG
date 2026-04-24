import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/config';
import { ACCOUNT_PLAN_LABEL, formatDollars, formatMonthlyValue } from '../state/accounts';
import { JOB_STATUS_LABEL } from '../state/jobs';
import type { GameState } from '../state/GameState';

export class RouteBookOverlay {
  private readonly state: GameState;
  private readonly container: Phaser.GameObjects.Container;
  private readonly headerText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly footerText: Phaser.GameObjects.Text;
  private readonly emptyText: Phaser.GameObjects.Text;
  private readonly summaryText: Phaser.GameObjects.Text;
  private open = false;

  constructor(scene: Phaser.Scene, state: GameState) {
    this.state = state;

    const w = GAME_WIDTH - 32;
    const h = GAME_HEIGHT - 32;
    const x = GAME_WIDTH / 2;
    const y = GAME_HEIGHT / 2;

    const dim = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55);
    const border = scene.add.rectangle(x, y, w, h, 0xd9c78a, 1);
    const bg = scene.add.rectangle(x, y, w - 2, h - 2, 0x0f1a14, 0.97);
    bg.setStrokeStyle(1, 0x2a3a2a);

    const left = x - w / 2 + 14;
    const top = y - h / 2 + 12;

    this.headerText = scene.add.text(left, top, 'Route Book', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#f4e7b4',
    });
    this.summaryText = scene.add
      .text(x + w / 2 - 14, top + 1, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#cfe9c3',
        align: 'right',
      })
      .setOrigin(1, 0);

    this.bodyText = scene.add.text(left, top + 30, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#cfe9c3',
    });
    this.bodyText.setLineSpacing(3);

    this.emptyText = scene.add.text(left, top + 30, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#8ab07a',
    });

    this.footerText = scene.add.text(left, y + h / 2 - 22, '', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#8ab07a',
    });

    this.container = scene.add.container(0, 0, [
      dim,
      border,
      bg,
      this.headerText,
      this.summaryText,
      this.bodyText,
      this.emptyText,
      this.footerText,
    ]);
    this.container.setScrollFactor(0);
    this.container.setDepth(120);
    this.container.setVisible(false);
  }

  show(): void {
    this.refresh();
    this.container.setVisible(true);
    this.open = true;
  }

  hide(): void {
    this.container.setVisible(false);
    this.open = false;
  }

  refresh(): void {
    const accounts = [...this.state.listAccounts()].sort((a, b) => a.openedTick - b.openedTick);
    const day = this.state.getCurrentDay();

    const totalMonthly = accounts.reduce((s, a) => s + a.monthlyValueCents, 0);
    const totalEarned = accounts.reduce((s, a) => s + a.totalEarnedCents, 0);
    this.summaryText.setText(
      [
        `Day ${day}`,
        `${accounts.length} account${accounts.length === 1 ? '' : 's'}`,
        `${formatMonthlyValue(totalMonthly)} recurring`,
        `${formatDollars(totalEarned)} earned`,
      ].join('   '),
    );

    if (accounts.length === 0) {
      this.bodyText.setText('');
      this.emptyText.setText(
        'No accounts on the route yet. Knock on doors, qualify a prospect, and close them out.',
      );
      this.footerText.setText('[Tab] close   [N] end day (advances to tomorrow)');
      return;
    }

    this.emptyText.setText('');

    const lines: string[] = [];
    accounts.forEach((account, idx) => {
      const planLabel = ACCOUNT_PLAN_LABEL[account.plan];
      const monthly = formatMonthlyValue(account.monthlyValueCents);
      const earned = formatDollars(account.totalEarnedCents);
      const todayJob = this.state
        .getJobsForNpc(account.npcId)
        .find((j) => j.scheduledDay === day);
      const statusLabel = todayJob ? JOB_STATUS_LABEL[todayJob.status] : 'No job today';
      const lastServiced = account.lastServicedDay ? `last day ${account.lastServicedDay}` : 'never serviced';

      lines.push(`${idx + 1}. ${account.npcName} — ${planLabel}`);
      lines.push(`   ${monthly}    earned ${earned}    ${lastServiced}    today: ${statusLabel}`);
    });

    this.bodyText.setText(lines.join('\n'));

    const readyCount = accounts.filter((a) =>
      this.state.getJobsForNpc(a.npcId).some(
        (j) => j.scheduledDay === day && j.status === 'scheduled',
      ),
    ).length;

    this.footerText.setText(
      readyCount > 0
        ? `[Tab] close   [N] end day   ${readyCount} job${readyCount === 1 ? '' : 's'} still scheduled today`
        : '[Tab] close   [N] end day (advances to tomorrow)',
    );
  }

  get isOpen(): boolean {
    return this.open;
  }
}
