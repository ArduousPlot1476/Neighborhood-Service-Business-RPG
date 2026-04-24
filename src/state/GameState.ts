import { getServicePlan } from '../content/services/servicePlans';
import type { AccountRecord } from './accounts';
import { createInitialDeal, type DealRecord, type DealStatus } from './deals';
import {
  createScheduledJob,
  type JobRecord,
  type JobStatus,
} from './jobs';
import {
  createInitialProspect,
  type ProspectRecord,
  type ProspectStatus,
} from './prospects';

export type DayState = 'in_progress' | 'closed';

export type GameStateListener = (event: GameStateChange) => void;

export type GameStateChange =
  | { readonly type: 'prospectStatusChanged'; readonly npcId: string; readonly previous: ProspectStatus; readonly next: ProspectStatus }
  | { readonly type: 'dealStatusChanged'; readonly npcId: string; readonly previous: DealStatus; readonly next: DealStatus }
  | { readonly type: 'accountOpened'; readonly account: AccountRecord }
  | { readonly type: 'jobScheduled'; readonly job: JobRecord }
  | { readonly type: 'jobStatusChanged'; readonly jobId: string; readonly previous: JobStatus; readonly next: JobStatus }
  | { readonly type: 'dayAdvanced'; readonly previousDay: number; readonly nextDay: number };

export interface SerializedGameState {
  readonly tick: number;
  readonly currentDay: number;
  readonly dayState: DayState;
  readonly prospects: ReadonlyArray<ProspectRecord>;
  readonly deals: ReadonlyArray<DealRecord>;
  readonly accounts: ReadonlyArray<AccountRecord>;
  readonly jobs: ReadonlyArray<JobRecord>;
}

export class GameState {
  private tick = 0;
  private currentDay = 1;
  private dayState: DayState = 'in_progress';
  private jobIdCounter = 0;
  private readonly prospects = new Map<string, ProspectRecord>();
  private readonly deals = new Map<string, DealRecord>();
  private readonly accounts = new Map<string, AccountRecord>();
  private readonly jobs = new Map<string, JobRecord>();
  private readonly listeners = new Set<GameStateListener>();

  registerProspect(npcId: string): ProspectRecord {
    const existing = this.prospects.get(npcId);
    if (existing) return existing;
    const record = createInitialProspect(npcId);
    this.prospects.set(npcId, record);
    return record;
  }

  getProspect(npcId: string): ProspectRecord | undefined {
    return this.prospects.get(npcId);
  }

  getProspectStatus(npcId: string): ProspectStatus {
    return this.prospects.get(npcId)?.status ?? 'unknown';
  }

  setProspectStatus(npcId: string, next: ProspectStatus, notes: string | null = null): void {
    const record = this.prospects.get(npcId) ?? this.registerProspect(npcId);
    const previous = record.status;
    if (previous === next) {
      record.notes = notes ?? record.notes;
      record.lastUpdatedTick = this.advanceTick();
      return;
    }
    record.status = next;
    record.notes = notes ?? record.notes;
    record.lastUpdatedTick = this.advanceTick();
    this.emit({ type: 'prospectStatusChanged', npcId, previous, next });
  }

  listProspects(): ReadonlyArray<ProspectRecord> {
    return [...this.prospects.values()];
  }

  ensureDeal(npcId: string): DealRecord {
    const existing = this.deals.get(npcId);
    if (existing) return existing;
    const record = createInitialDeal(npcId);
    this.deals.set(npcId, record);
    return record;
  }

  getDeal(npcId: string): DealRecord | undefined {
    return this.deals.get(npcId);
  }

  getDealStatus(npcId: string): DealStatus {
    return this.deals.get(npcId)?.status ?? 'none';
  }

  setDealStatus(npcId: string, next: DealStatus, notes: string | null = null): void {
    const record = this.ensureDeal(npcId);
    const previous = record.status;
    if (previous === next) {
      record.notes = notes ?? record.notes;
      record.lastUpdatedTick = this.advanceTick();
      return;
    }
    record.status = next;
    record.lastOutcome = next === 'in_progress' ? record.lastOutcome : next;
    record.notes = notes ?? record.notes;
    record.lastUpdatedTick = this.advanceTick();
    this.emit({ type: 'dealStatusChanged', npcId, previous, next });
  }

  recordEncounterAttempt(npcId: string): void {
    const record = this.ensureDeal(npcId);
    record.attempts += 1;
    record.lastUpdatedTick = this.advanceTick();
  }

  listDeals(): ReadonlyArray<DealRecord> {
    return [...this.deals.values()];
  }

  openAccount(account: AccountRecord): AccountRecord {
    if (this.accounts.has(account.id)) {
      return this.accounts.get(account.id)!;
    }
    this.accounts.set(account.id, account);
    this.emit({ type: 'accountOpened', account });
    return account;
  }

  getAccount(accountId: string): AccountRecord | undefined {
    return this.accounts.get(accountId);
  }

  getAccountByNpc(npcId: string): AccountRecord | undefined {
    for (const account of this.accounts.values()) {
      if (account.npcId === npcId) return account;
    }
    return undefined;
  }

  listAccounts(): ReadonlyArray<AccountRecord> {
    return [...this.accounts.values()];
  }

  scheduleJob(args: {
    accountId: string;
    npcId: string;
    servicePlanId: string;
    scheduledDay: number;
    zonesTotal: number;
  }): JobRecord {
    this.jobIdCounter += 1;
    const job = createScheduledJob({
      id: `job_${this.jobIdCounter}`,
      ...args,
    });
    this.jobs.set(job.id, job);
    this.emit({ type: 'jobScheduled', job });
    return job;
  }

  setJobStatus(jobId: string, next: JobStatus): void {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`setJobStatus: unknown jobId "${jobId}"`);
    const previous = job.status;
    if (previous === next) return;
    job.status = next;
    this.emit({ type: 'jobStatusChanged', jobId, previous, next });
  }

  finishJob(args: {
    jobId: string;
    status: JobStatus;
    qualityScore: number;
    payoutCents: number;
    zonesCleared: number;
    qualityLabel: NonNullable<JobRecord['quality']>;
  }): JobRecord {
    const job = this.jobs.get(args.jobId);
    if (!job) throw new Error(`finishJob: unknown jobId "${args.jobId}"`);
    const previous = job.status;
    job.status = args.status;
    job.qualityScore = args.qualityScore;
    job.payoutCents = args.payoutCents;
    job.zonesCleared = args.zonesCleared;
    job.quality = args.qualityLabel;
    job.completedTick = this.advanceTick();
    if (previous !== args.status) {
      this.emit({ type: 'jobStatusChanged', jobId: job.id, previous, next: args.status });
    }
    if (args.status === 'completed' || args.status === 'failed') {
      const account = this.accounts.get(job.accountId);
      if (account) {
        account.totalEarnedCents += args.payoutCents;
        account.lastServicedDay = this.currentDay;
        if (args.status === 'completed') {
          account.jobsCompleted += 1;
        }
      }
    }
    return job;
  }

  startJob(jobId: string): JobRecord {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`startJob: unknown jobId "${jobId}"`);
    if (job.status === 'scheduled') {
      this.setJobStatus(jobId, 'in_progress');
      job.startedTick = this.advanceTick();
    }
    return job;
  }

  getJob(jobId: string): JobRecord | undefined {
    return this.jobs.get(jobId);
  }

  listJobs(): ReadonlyArray<JobRecord> {
    return [...this.jobs.values()];
  }

  getJobsForDay(day: number): ReadonlyArray<JobRecord> {
    return this.listJobs().filter((j) => j.scheduledDay === day);
  }

  getActiveJobForNpc(npcId: string, day: number): JobRecord | undefined {
    for (const job of this.jobs.values()) {
      if (job.npcId !== npcId) continue;
      if (job.scheduledDay !== day) continue;
      if (job.status === 'scheduled' || job.status === 'in_progress') return job;
    }
    return undefined;
  }

  getJobsForNpc(npcId: string): ReadonlyArray<JobRecord> {
    return this.listJobs().filter((j) => j.npcId === npcId);
  }

  getCurrentDay(): number {
    return this.currentDay;
  }

  getDayState(): DayState {
    return this.dayState;
  }

  closeDay(): { previousDay: number; nextDay: number; missedJobs: ReadonlyArray<JobRecord>; nextJobs: ReadonlyArray<JobRecord> } {
    const previousDay = this.currentDay;
    const missed: JobRecord[] = [];
    for (const job of this.jobs.values()) {
      if (job.scheduledDay === previousDay && job.status === 'scheduled') {
        job.status = 'missed';
        missed.push(job);
        this.emit({ type: 'jobStatusChanged', jobId: job.id, previous: 'scheduled', next: 'missed' });
      }
    }

    const nextDay = previousDay + 1;
    this.currentDay = nextDay;
    this.dayState = 'in_progress';

    const nextJobs: JobRecord[] = [];
    for (const account of this.accounts.values()) {
      const last = this.lastFinishedJobForAccount(account.id);
      if (last) {
        const plan = getServicePlan(account.plan);
        const due = (last.completedTick !== null ? last : last).scheduledDay + plan.cadenceDays;
        if (nextDay >= due && !this.hasOpenJobForAccount(account.id)) {
          const job = this.scheduleJob({
            accountId: account.id,
            npcId: account.npcId,
            servicePlanId: account.plan,
            scheduledDay: nextDay,
            zonesTotal: plan.defaultZoneCount,
          });
          nextJobs.push(job);
        }
      }
    }

    this.emit({ type: 'dayAdvanced', previousDay, nextDay });
    return { previousDay, nextDay, missedJobs: missed, nextJobs };
  }

  private hasOpenJobForAccount(accountId: string): boolean {
    for (const job of this.jobs.values()) {
      if (job.accountId !== accountId) continue;
      if (job.status === 'scheduled' || job.status === 'in_progress') return true;
    }
    return false;
  }

  private lastFinishedJobForAccount(accountId: string): JobRecord | undefined {
    let best: JobRecord | undefined;
    for (const job of this.jobs.values()) {
      if (job.accountId !== accountId) continue;
      if (job.status !== 'completed' && job.status !== 'missed' && job.status !== 'failed') continue;
      if (!best || job.scheduledDay > best.scheduledDay) best = job;
    }
    return best;
  }

  currentTick(): number {
    return this.tick;
  }

  advanceTick(): number {
    this.tick += 1;
    return this.tick;
  }

  on(listener: GameStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  toJSON(): SerializedGameState {
    return {
      tick: this.tick,
      currentDay: this.currentDay,
      dayState: this.dayState,
      prospects: this.listProspects().map((p) => ({ ...p })),
      deals: this.listDeals().map((d) => ({ ...d })),
      accounts: this.listAccounts().map((a) => ({ ...a })),
      jobs: this.listJobs().map((j) => ({ ...j })),
    };
  }

  private emit(change: GameStateChange): void {
    for (const listener of this.listeners) {
      listener(change);
    }
  }
}
