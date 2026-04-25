import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/config';
import {
  ACCOUNT_PLAN_LABEL,
  formatDollars,
  formatMonthlyValue,
} from '../state/accounts';
import {
  JOB_QUALITY_LABEL,
  JOB_STATUS_LABEL,
  type JobRecord,
} from '../state/jobs';
import type { GameState, DayCloseSummary } from '../state/GameState';
import type { DisruptionDayCloseDigest } from '../systems/rival/disruptionTypes';

export const DAY_CLOSE_DONE_EVENT = 'dayclose:done';

export interface DayCloseAdvanceResult {
  readonly summary: DayCloseSummary;
  readonly disruptions: DisruptionDayCloseDigest;
}

export interface DayCloseSceneData {
  readonly state: GameState;
  readonly onAdvance: () => DayCloseAdvanceResult;
}

export class DayCloseScene extends Phaser.Scene {
  private state!: GameState;
  private onAdvance!: () => DayCloseAdvanceResult;
  private released = false;

  private continueKey!: Phaser.Input.Keyboard.Key;
  private altContinueKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'DayCloseScene' });
  }

  init(data: DayCloseSceneData): void {
    this.state = data.state;
    this.onAdvance = data.onAdvance;
    this.released = false;
  }

  create(): void {
    const closingDay = this.state.getCurrentDay();

    const advance = this.onAdvance();
    const { summary, disruptions } = advance;

    // Snapshot today's jobs AFTER advance so their statuses reflect the close:
    // scheduled → missed conversions, completed/failed jobs retain their prior status.
    const todayJobs = this.state.getJobsForDay(closingDay).map((j) => ({ ...j }));
    const earnedToday = todayJobs.reduce((s, j) => s + (j.payoutCents ?? 0), 0);

    const completed = todayJobs.filter((j) => j.status === 'completed');
    const failed = todayJobs.filter((j) => j.status === 'failed');
    const missed = todayJobs.filter((j) => j.status === 'missed');

    const accounts = this.state.listAccounts();
    const activeAccounts = accounts.filter((a) => !a.churned);
    const totalRecurring = activeAccounts.reduce((s, a) => s + a.monthlyValueCents, 0);
    const totalLifetime = accounts.reduce((s, a) => s + a.totalEarnedCents, 0);

    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55);
    dim.setDepth(0);

    const w = GAME_WIDTH - 60;
    const h = GAME_HEIGHT - 28;
    const x = GAME_WIDTH / 2;
    const y = GAME_HEIGHT / 2;
    const border = this.add.rectangle(x, y, w, h, 0xa48748, 1);
    const bg = this.add.rectangle(x, y, w - 2, h - 2, 0xf4e9d0, 0.99);
    bg.setStrokeStyle(1, 0xc8b27e);
    border.setDepth(1);
    bg.setDepth(1);

    const left = x - w / 2 + 18;
    const top = y - h / 2 + 14;

    this.add
      .text(left, top, `Day ${summary.previousDay} — closed`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#1a1410',
      })
      .setDepth(2);

    this.add
      .text(x + w / 2 - 18, top + 2, this.cohortLine(activeAccounts.length, totalRecurring, totalLifetime), {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#3a2e24',
        align: 'right',
      })
      .setOrigin(1, 0)
      .setDepth(2);

    let cursorY = top + 30;

    this.add
      .text(left, cursorY, `Earned today: ${formatDollars(earnedToday)}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: earnedToday > 0 ? '#3d6b2c' : '#1a1410',
      })
      .setDepth(2);
    cursorY += 16;

    this.add
      .text(left, cursorY, this.tallyLine(completed.length, failed.length, missed.length), {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#3a2e24',
      })
      .setDepth(2);
    cursorY += 18;

    this.add
      .text(left, cursorY, "Today's work:", {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#7a624a',
      })
      .setDepth(2);
    cursorY += 12;

    const detailLines = todayJobs.length === 0
      ? ['  (no jobs were scheduled for today)']
      : todayJobs.map((job) => this.formatJobLine(job));
    const jobsText = this.add
      .text(left, cursorY, detailLines.join('\n'), {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#3a2e24',
        lineSpacing: 3,
      })
      .setDepth(2);
    cursorY += jobsText.height + 8;

    if (
      disruptions.triggered.length > 0 ||
      disruptions.resolved.length > 0 ||
      disruptions.expired.length > 0 ||
      disruptions.drifted.length > 0
    ) {
      this.add
        .text(left, cursorY, 'IronRoot activity:', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#a23a1c',
        })
        .setDepth(2);
      cursorY += 12;

      const lines: string[] = [];
      for (const d of disruptions.triggered) {
        lines.push(`  ! Doorhanger left at ${this.npcLabelByAccount(d.accountId)}. ${disruptions.triggered.length === 1 ? 'Win them back fast.' : ''}`.trimEnd());
      }
      for (const d of disruptions.expired) {
        lines.push(`  x ${this.npcLabelByAccount(d.accountId)} signed with IronRoot. Account churned.`);
      }
      for (const drift of disruptions.drifted) {
        const npc = this.npcLabelByAccount(drift.disruption.accountId);
        const days = Math.max(0, drift.disruption.deadlineDay - summary.nextDay);
        lines.push(`  · ${npc} drifted ${drift.delta} satisfaction (${days} days left)`);
      }
      const disruptionText = this.add
        .text(left, cursorY, lines.join('\n'), {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#3a2e24',
          lineSpacing: 3,
        })
        .setDepth(2);
      cursorY += disruptionText.height + 8;
    }

    if (summary.nextJobs.length > 0) {
      this.add
        .text(left, cursorY, `Tomorrow on the route: ${summary.nextJobs.length} job${summary.nextJobs.length === 1 ? '' : 's'} scheduled.`, {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#a48748',
        })
        .setDepth(2);
      cursorY += 14;
    }

    const teaser = this.buildTeaser(summary, disruptions, activeAccounts.length);
    this.add
      .text(left, y + h / 2 - 38, teaser, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#a48748',
        wordWrap: { width: w - 32 },
      })
      .setDepth(2);

    this.add
      .text(x, y + h / 2 - 18, '[E / Space] start tomorrow', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#7a624a',
      })
      .setOrigin(0.5, 0)
      .setDepth(2);

    const kb = this.input.keyboard;
    if (!kb) throw new Error('DayCloseScene: keyboard unavailable.');
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.continueKey = kb.addKey(K.E);
    this.altContinueKey = kb.addKey(K.SPACE);
  }

  override update(): void {
    if (this.released) return;
    if (
      Phaser.Input.Keyboard.JustDown(this.continueKey) ||
      Phaser.Input.Keyboard.JustDown(this.altContinueKey)
    ) {
      this.released = true;
      this.events.emit(DAY_CLOSE_DONE_EVENT);
      this.scene.stop();
    }
  }

  private cohortLine(accountCount: number, recurring: number, lifetime: number): string {
    return [
      `${accountCount} active account${accountCount === 1 ? '' : 's'}`,
      `${formatMonthlyValue(recurring)} recurring`,
      `${formatDollars(lifetime)} lifetime`,
    ].join('   ');
  }

  private tallyLine(completed: number, failed: number, missed: number): string {
    const parts: string[] = [];
    parts.push(`Completed: ${completed}`);
    if (failed > 0) parts.push(`Did not finish: ${failed}`);
    if (missed > 0) parts.push(`Missed: ${missed}`);
    return parts.join('   ');
  }

  private formatJobLine(job: JobRecord): string {
    const account = this.state.getAccount(job.accountId);
    const name = account?.npcName ?? job.npcId;
    const planLabel = account ? ACCOUNT_PLAN_LABEL[account.plan] : job.servicePlanId;
    const status = JOB_STATUS_LABEL[job.status];
    const quality = job.quality ? `, ${JOB_QUALITY_LABEL[job.quality]}` : '';
    const payout = job.payoutCents !== null && job.payoutCents > 0
      ? formatDollars(job.payoutCents)
      : '—';
    return `  • ${name} — ${planLabel}: ${status}${quality}, payout ${payout}`;
  }

  private npcLabelByAccount(accountId: string): string {
    const account = this.state.getAccount(accountId);
    return account?.npcName ?? accountId;
  }

  private buildTeaser(
    summary: DayCloseSummary,
    disruptions: DisruptionDayCloseDigest,
    activeAccounts: number,
  ): string {
    const tomorrow = summary.nextDay;
    const triggered = disruptions.triggered.length;
    const expired = disruptions.expired.length;
    if (expired > 0) {
      return `Tomorrow: Day ${tomorrow}. You lost ground today — review the route and rebuild.`;
    }
    if (triggered > 0) {
      const account = this.state.getAccount(disruptions.triggered[0]!.accountId);
      const name = account?.npcName ?? 'the contested account';
      return `Tomorrow: Day ${tomorrow}. IronRoot is on ${name}. A solid service visit clears them; ignoring the porch will lose the account.`;
    }
    if (activeAccounts === 0) {
      return `Tomorrow: Day ${tomorrow}. Keep knocking — the route starts with the first yes.`;
    }
    if (summary.missedJobs.length > 0) {
      return `Tomorrow: Day ${tomorrow}. Missed work doesn't disappear — catch-up jobs are scheduled.`;
    }
    if (summary.nextJobs.length > 0) {
      return `Tomorrow: Day ${tomorrow}. New service windows open. Health holds.`;
    }
    return `Tomorrow: Day ${tomorrow}. Route's quiet — pick up another door.`;
  }
}
