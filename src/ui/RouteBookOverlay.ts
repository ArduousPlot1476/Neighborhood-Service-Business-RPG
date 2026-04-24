import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/config';
import {
  ACCOUNT_PLAN_LABEL,
  formatDollars,
  formatMonthlyValue,
  riskBandFromSatisfaction,
  RISK_BAND_LABEL,
} from '../state/accounts';
import { JOB_STATUS_LABEL } from '../state/jobs';
import type { GameState } from '../state/GameState';
import { hasSavedGame } from '../state/saveSystem';

export class RouteBookOverlay {
  private readonly state: GameState;
  private readonly container: Phaser.GameObjects.Container;
  private readonly headerText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly footerText: Phaser.GameObjects.Text;
  private readonly emptyText: Phaser.GameObjects.Text;
  private readonly summaryText: Phaser.GameObjects.Text;
  private readonly disruptionText: Phaser.GameObjects.Text;
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

    this.disruptionText = scene.add.text(left, top + 22, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#e08a85',
      wordWrap: { width: w - 28 },
    });
    this.disruptionText.setLineSpacing(2);

    this.bodyText = scene.add.text(left, top + 50, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#cfe9c3',
    });
    this.bodyText.setLineSpacing(3);

    this.emptyText = scene.add.text(left, top + 50, '', {
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
      this.disruptionText,
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

    const activeAccounts = accounts.filter((a) => !a.churned);
    const churnedAccounts = accounts.filter((a) => a.churned);

    const totalMonthly = activeAccounts.reduce((s, a) => s + a.monthlyValueCents, 0);
    const totalEarned = accounts.reduce((s, a) => s + a.totalEarnedCents, 0);
    this.summaryText.setText(
      [
        `Day ${day}`,
        `${activeAccounts.length} account${activeAccounts.length === 1 ? '' : 's'}`,
        `${formatMonthlyValue(totalMonthly)} recurring`,
        `${formatDollars(totalEarned)} earned`,
      ].join('   '),
    );

    const activeDisruptions = this.state.listActiveDisruptions();
    if (activeDisruptions.length === 0) {
      this.disruptionText.setText('');
    } else {
      const lines = activeDisruptions.map((d) => {
        const remaining = Math.max(0, d.deadlineDay - day);
        return `! IronRoot is contesting ${this.npcLabel(d.accountId)} — ${remaining} day${remaining === 1 ? '' : 's'} left to win them back.`;
      });
      this.disruptionText.setText(lines.join('\n'));
    }

    if (accounts.length === 0) {
      this.bodyText.setText('');
      const hint = [
        'No accounts on the route yet.',
        '',
        'Try this:',
        '  1. Walk up to a neighbour and press [E] to talk',
        '  2. Pick the dialogue branch that lands them on "Qualified"',
        '  3. Re-approach to enter the Closing Encounter, then win the deal',
        '  4. Their yard will mark a job; service it under the timer',
        '',
        'Day 1 starts with three workable doors: Jerry (top-left), Linda (centre), Marcus (top-right).',
      ].join('\n');
      this.emptyText.setText(hint);
      this.footerText.setText(this.footerHint(0));
      return;
    }

    this.emptyText.setText('');

    const lines: string[] = [];
    let idx = 0;
    for (const account of activeAccounts) {
      idx += 1;
      const planLabel = ACCOUNT_PLAN_LABEL[account.plan];
      const monthly = formatMonthlyValue(account.monthlyValueCents);
      const earned = formatDollars(account.totalEarnedCents);
      const todayJob = this.state
        .getJobsForNpc(account.npcId)
        .find((j) => j.scheduledDay === day);
      const statusLabel = todayJob ? JOB_STATUS_LABEL[todayJob.status] : 'No job today';
      const lastServiced = account.lastServicedDay ? `last day ${account.lastServicedDay}` : 'never serviced';
      const band = riskBandFromSatisfaction(account.satisfaction);
      const bandLabel = RISK_BAND_LABEL[band];
      const contested = this.state.getActiveDisruptionForAccount(account.id);
      const overdue = !todayJob && account.nextDueDay < day;
      const tags: string[] = [];
      if (overdue) tags.push('OVERDUE');
      if (contested) tags.push('CONTESTED');
      const tagSuffix = tags.length > 0 ? `   [${tags.join(' · ')}]` : '';

      lines.push(`${idx}. ${account.npcName} — ${planLabel}${tagSuffix}`);
      lines.push(`   ${monthly}    earned ${earned}    ${lastServiced}    today: ${statusLabel}`);
      lines.push(`   health: ${account.satisfaction}/100 (${bandLabel})    next due: day ${account.nextDueDay}`);
    }

    if (churnedAccounts.length > 0) {
      lines.push('');
      lines.push('--- LOST TO IRONROOT ---');
      for (const account of churnedAccounts) {
        idx += 1;
        const planLabel = ACCOUNT_PLAN_LABEL[account.plan];
        const earned = formatDollars(account.totalEarnedCents);
        lines.push(`${idx}. ${account.npcName} — ${planLabel} — earned ${earned} (churned day ${account.churnedDay ?? '?'})`);
      }
    }

    this.bodyText.setText(lines.join('\n'));

    const readyCount = activeAccounts.filter((a) =>
      this.state.getJobsForNpc(a.npcId).some(
        (j) => j.scheduledDay === day && j.status === 'scheduled',
      ),
    ).length;

    this.footerText.setText(this.footerHint(readyCount));
  }

  private footerHint(readyCount: number): string {
    const parts = ['[Tab] close', '[N] end day', '[S] save'];
    if (hasSavedGame()) parts.push('[Shift+R] clear save');
    if (readyCount > 0) {
      parts.push(`${readyCount} job${readyCount === 1 ? '' : 's'} still scheduled today`);
    }
    return parts.join('   ');
  }

  get isOpen(): boolean {
    return this.open;
  }

  private npcLabel(accountId: string): string {
    const account = this.state.getAccount(accountId);
    return account?.npcName ?? accountId;
  }
}
