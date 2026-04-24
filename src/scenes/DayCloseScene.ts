import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/config';
import { formatDollars, formatMonthlyValue, ACCOUNT_PLAN_LABEL } from '../state/accounts';
import {
  JOB_QUALITY_LABEL,
  JOB_STATUS_LABEL,
  type JobRecord,
} from '../state/jobs';
import type { GameState } from '../state/GameState';

export const DAY_CLOSE_DONE_EVENT = 'dayclose:done';

export interface DayCloseSceneData {
  readonly state: GameState;
  readonly onAdvance: () => void;
}

export class DayCloseScene extends Phaser.Scene {
  private state!: GameState;
  private onAdvance!: () => void;
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
    const day = this.state.getCurrentDay();
    const todayJobs = this.state.getJobsForDay(day);
    const completed = todayJobs.filter((j) => j.status === 'completed');
    const failed = todayJobs.filter((j) => j.status === 'failed');
    const stillScheduled = todayJobs.filter((j) => j.status === 'scheduled');
    const earnedToday = todayJobs.reduce((s, j) => s + (j.payoutCents ?? 0), 0);

    const accounts = this.state.listAccounts();
    const totalRecurring = accounts.reduce((s, a) => s + a.monthlyValueCents, 0);
    const totalLifetime = accounts.reduce((s, a) => s + a.totalEarnedCents, 0);

    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
    dim.setDepth(0);

    const w = GAME_WIDTH - 60;
    const h = GAME_HEIGHT - 40;
    const x = GAME_WIDTH / 2;
    const y = GAME_HEIGHT / 2;
    const border = this.add.rectangle(x, y, w, h, 0xd9c78a, 1);
    const bg = this.add.rectangle(x, y, w - 2, h - 2, 0x0f1a14, 0.98);
    bg.setStrokeStyle(1, 0x2a3a2a);
    border.setDepth(1);
    bg.setDepth(1);

    const left = x - w / 2 + 18;
    const top = y - h / 2 + 16;

    this.add
      .text(left, top, `Day ${day} — closing out`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#f4e7b4',
      })
      .setDepth(2);

    this.add
      .text(x + w / 2 - 18, top + 2, this.cohortLine(accounts.length, totalRecurring, totalLifetime), {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#cfe9c3',
        align: 'right',
      })
      .setOrigin(1, 0)
      .setDepth(2);

    const summaryY = top + 36;
    this.add
      .text(left, summaryY, `Earned today: ${formatDollars(earnedToday)}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: earnedToday > 0 ? '#9fd96a' : '#cfe9c3',
      })
      .setDepth(2);

    this.add
      .text(left, summaryY + 16, this.tallyLine(completed.length, failed.length, stillScheduled.length), {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#cfe9c3',
      })
      .setDepth(2);

    const detailsY = summaryY + 40;
    this.add
      .text(left, detailsY, "Today's work:", {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#8ab07a',
      })
      .setDepth(2);

    const detailLines = todayJobs.length === 0
      ? ['  (no jobs were scheduled for today)']
      : todayJobs.map((job) => this.formatJobLine(job));
    this.add
      .text(left, detailsY + 14, detailLines.join('\n'), {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#cfe9c3',
        lineSpacing: 3,
      })
      .setDepth(2);

    const teaser = this.buildTeaser(day, accounts.length, completed.length, stillScheduled.length);
    this.add
      .text(left, y + h / 2 - 44, teaser, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#f0c878',
      })
      .setDepth(2);

    this.add
      .text(x, y + h / 2 - 22, '[E / Space] start tomorrow', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#8ab07a',
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
      this.onAdvance();
      this.events.emit(DAY_CLOSE_DONE_EVENT);
      this.scene.stop();
    }
  }

  private cohortLine(accountCount: number, recurring: number, lifetime: number): string {
    return [
      `${accountCount} account${accountCount === 1 ? '' : 's'} on the route`,
      `${formatMonthlyValue(recurring)} recurring`,
      `${formatDollars(lifetime)} lifetime`,
    ].join('   ');
  }

  private tallyLine(completed: number, failed: number, stillScheduled: number): string {
    const parts: string[] = [];
    parts.push(`Completed: ${completed}`);
    if (failed > 0) parts.push(`Did not finish: ${failed}`);
    if (stillScheduled > 0) parts.push(`Missed: ${stillScheduled}`);
    return parts.join('   ');
  }

  private formatJobLine(job: JobRecord): string {
    const npc = this.state.getProspect(job.npcId);
    const account = this.state.getAccount(job.accountId);
    const name = account?.npcName ?? npc?.npcId ?? job.npcId;
    const planLabel = account ? ACCOUNT_PLAN_LABEL[account.plan] : job.servicePlanId;
    const status = JOB_STATUS_LABEL[job.status];
    const quality = job.quality ? `, ${JOB_QUALITY_LABEL[job.quality]}` : '';
    const payout = job.payoutCents !== null ? formatDollars(job.payoutCents) : '—';
    return `  • ${name} — ${planLabel}: ${status}${quality}, payout ${payout}`;
  }

  private buildTeaser(currentDay: number, accountCount: number, completedToday: number, missedToday: number): string {
    const tomorrow = currentDay + 1;
    if (accountCount === 0) {
      return `Tomorrow: Day ${tomorrow}. Keep knocking — the route starts with the first yes.`;
    }
    if (missedToday > 0) {
      return `Tomorrow: Day ${tomorrow}. Catch up on what slipped today and keep the streak going.`;
    }
    if (completedToday > 0) {
      return `Tomorrow: Day ${tomorrow}. Route's holding. Next service window opens on cadence.`;
    }
    return `Tomorrow: Day ${tomorrow}. Route's set; jobs schedule themselves as cadences come due.`;
  }
}
