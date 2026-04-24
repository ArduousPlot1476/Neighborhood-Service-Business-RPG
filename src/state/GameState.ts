import { getServicePlan } from '../content/services/servicePlans';
import {
  clampSatisfaction,
  satisfactionDeltaForCompletedJob,
  satisfactionDeltaForFailedJob,
  satisfactionDeltaForMissedJob,
  type AccountRecord,
  type AccountRiskBand,
} from './accounts';
import { riskBandFromSatisfaction } from './accounts';
import { createInitialDeal, type DealRecord, type DealStatus } from './deals';
import {
  createDisruptionRecord,
  type DisruptionRecord,
  type DisruptionStatus,
} from './disruptions';
import {
  createScheduledJob,
  type JobQuality,
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
  | { readonly type: 'accountSatisfactionChanged'; readonly accountId: string; readonly previous: number; readonly next: number; readonly previousBand: AccountRiskBand; readonly nextBand: AccountRiskBand; readonly note: string | null }
  | { readonly type: 'accountChurned'; readonly accountId: string }
  | { readonly type: 'jobScheduled'; readonly job: JobRecord }
  | { readonly type: 'jobStatusChanged'; readonly jobId: string; readonly previous: JobStatus; readonly next: JobStatus }
  | { readonly type: 'dayAdvanced'; readonly previousDay: number; readonly nextDay: number }
  | { readonly type: 'disruptionTriggered'; readonly disruption: DisruptionRecord }
  | { readonly type: 'disruptionStatusChanged'; readonly disruptionId: string; readonly previous: DisruptionStatus; readonly next: DisruptionStatus };

export interface SerializedGameState {
  readonly tick: number;
  readonly currentDay: number;
  readonly dayState: DayState;
  readonly prospects: ReadonlyArray<ProspectRecord>;
  readonly deals: ReadonlyArray<DealRecord>;
  readonly accounts: ReadonlyArray<AccountRecord>;
  readonly jobs: ReadonlyArray<JobRecord>;
  readonly disruptions: ReadonlyArray<DisruptionRecord>;
}

export interface DayCloseSummary {
  readonly previousDay: number;
  readonly nextDay: number;
  readonly missedJobs: ReadonlyArray<JobRecord>;
  readonly failedJobsCarriedOver: ReadonlyArray<JobRecord>;
  readonly nextJobs: ReadonlyArray<JobRecord>;
}

export class GameState {
  private tick = 0;
  private currentDay = 1;
  private dayState: DayState = 'in_progress';
  private jobIdCounter = 0;
  private disruptionIdCounter = 0;
  private readonly prospects = new Map<string, ProspectRecord>();
  private readonly deals = new Map<string, DealRecord>();
  private readonly accounts = new Map<string, AccountRecord>();
  private readonly jobs = new Map<string, JobRecord>();
  private readonly disruptions = new Map<string, DisruptionRecord>();
  private readonly listeners = new Set<GameStateListener>();

  // ---------- prospects ----------

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

  // ---------- deals ----------

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

  // ---------- accounts ----------

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

  adjustSatisfaction(accountId: string, delta: number, note: string | null = null): void {
    const account = this.accounts.get(accountId);
    if (!account) return;
    if (delta === 0) return;
    const previous = account.satisfaction;
    const next = clampSatisfaction(previous + delta);
    if (previous === next) return;
    account.satisfaction = next;
    const previousBand = riskBandFromSatisfaction(previous);
    const nextBand = riskBandFromSatisfaction(next);
    this.advanceTick();
    this.emit({
      type: 'accountSatisfactionChanged',
      accountId,
      previous,
      next,
      previousBand,
      nextBand,
      note,
    });
  }

  churnAccount(accountId: string, day: number): void {
    const account = this.accounts.get(accountId);
    if (!account || account.churned) return;
    account.churned = true;
    account.churnedDay = day;
    this.advanceTick();
    this.emit({ type: 'accountChurned', accountId });
  }

  // ---------- jobs ----------

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
    const account = this.accounts.get(job.accountId);
    if (!account) return job;

    account.totalEarnedCents += args.payoutCents;

    if (args.status === 'completed') {
      account.jobsCompleted += 1;
      account.lastServicedDay = this.currentDay;
      const plan = getServicePlan(account.plan);
      account.nextDueDay = job.scheduledDay + plan.cadenceDays;
      this.adjustSatisfaction(
        account.id,
        satisfactionDeltaForCompletedJob(args.qualityLabel),
        `Job completed (${args.qualityLabel})`,
      );
    } else if (args.status === 'failed') {
      account.jobsFailed += 1;
      account.nextDueDay = this.currentDay + 1;
      this.adjustSatisfaction(account.id, satisfactionDeltaForFailedJob(), 'Job failed');
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

  getLastCompletedJobForAccount(accountId: string): JobRecord | undefined {
    let best: JobRecord | undefined;
    for (const job of this.jobs.values()) {
      if (job.accountId !== accountId) continue;
      if (job.status !== 'completed') continue;
      if (!best || job.scheduledDay > best.scheduledDay) best = job;
    }
    return best;
  }

  getLatestQualityForAccount(accountId: string): JobQuality | null {
    let best: JobRecord | undefined;
    for (const job of this.jobs.values()) {
      if (job.accountId !== accountId) continue;
      if (job.status !== 'completed') continue;
      if (!best || (job.completedTick ?? 0) > (best.completedTick ?? 0)) best = job;
    }
    return best?.quality ?? null;
  }

  // ---------- disruptions ----------

  addDisruption(args: {
    eventId: string;
    accountId: string;
    npcId: string;
    triggeredDay: number;
    deadlineDay: number;
    narrative: string;
  }): DisruptionRecord {
    this.disruptionIdCounter += 1;
    const record = createDisruptionRecord({
      id: `disruption_${this.disruptionIdCounter}`,
      ...args,
    });
    this.disruptions.set(record.id, record);
    this.advanceTick();
    this.emit({ type: 'disruptionTriggered', disruption: record });
    return record;
  }

  markDisruptionResolved(disruptionId: string, day: number): void {
    const record = this.disruptions.get(disruptionId);
    if (!record || record.status !== 'active') return;
    const previous = record.status;
    record.status = 'resolved';
    record.resolution = 'won_back';
    record.resolvedDay = day;
    this.advanceTick();
    this.emit({ type: 'disruptionStatusChanged', disruptionId, previous, next: 'resolved' });
  }

  markDisruptionExpired(disruptionId: string, day: number): void {
    const record = this.disruptions.get(disruptionId);
    if (!record || record.status !== 'active') return;
    const previous = record.status;
    record.status = 'expired';
    record.resolution = 'lost_to_rival';
    record.resolvedDay = day;
    this.advanceTick();
    this.emit({ type: 'disruptionStatusChanged', disruptionId, previous, next: 'expired' });
  }

  getActiveDisruptionForAccount(accountId: string): DisruptionRecord | undefined {
    for (const record of this.disruptions.values()) {
      if (record.accountId !== accountId) continue;
      if (record.status === 'active') return record;
    }
    return undefined;
  }

  getActiveDisruptionForNpc(npcId: string): DisruptionRecord | undefined {
    for (const record of this.disruptions.values()) {
      if (record.npcId !== npcId) continue;
      if (record.status === 'active') return record;
    }
    return undefined;
  }

  listDisruptions(): ReadonlyArray<DisruptionRecord> {
    return [...this.disruptions.values()];
  }

  listActiveDisruptions(): ReadonlyArray<DisruptionRecord> {
    return this.listDisruptions().filter((d) => d.status === 'active');
  }

  // ---------- day cycle ----------

  getCurrentDay(): number {
    return this.currentDay;
  }

  getDayState(): DayState {
    return this.dayState;
  }

  closeDay(): DayCloseSummary {
    const previousDay = this.currentDay;
    const missed: JobRecord[] = [];
    const failedCarriedOver: JobRecord[] = [];

    for (const job of this.jobs.values()) {
      if (job.scheduledDay === previousDay && job.status === 'scheduled') {
        job.status = 'missed';
        missed.push(job);
        this.emit({
          type: 'jobStatusChanged',
          jobId: job.id,
          previous: 'scheduled',
          next: 'missed',
        });
        const account = this.accounts.get(job.accountId);
        if (account && !account.churned) {
          account.jobsMissed += 1;
          account.nextDueDay = previousDay + 1;
          this.adjustSatisfaction(account.id, satisfactionDeltaForMissedJob(), 'Service missed');
        }
      }
      if (job.scheduledDay === previousDay && job.status === 'failed') {
        const account = this.accounts.get(job.accountId);
        if (account && !account.churned) {
          failedCarriedOver.push(job);
        }
      }
    }

    const nextDay = previousDay + 1;
    this.currentDay = nextDay;
    this.dayState = 'in_progress';

    const nextJobs: JobRecord[] = [];
    for (const account of this.accounts.values()) {
      if (account.churned) continue;
      if (this.hasOpenJobForAccount(account.id)) continue;
      if (account.nextDueDay <= nextDay) {
        const plan = getServicePlan(account.plan);
        const job = this.scheduleJob({
          accountId: account.id,
          npcId: account.npcId,
          servicePlanId: plan.id,
          scheduledDay: nextDay,
          zonesTotal: plan.defaultZoneCount,
        });
        nextJobs.push(job);
      }
    }

    this.emit({ type: 'dayAdvanced', previousDay, nextDay });
    return { previousDay, nextDay, missedJobs: missed, failedJobsCarriedOver: failedCarriedOver, nextJobs };
  }

  private hasOpenJobForAccount(accountId: string): boolean {
    for (const job of this.jobs.values()) {
      if (job.accountId !== accountId) continue;
      if (job.status === 'scheduled' || job.status === 'in_progress') return true;
    }
    return false;
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
      disruptions: this.listDisruptions().map((d) => ({ ...d })),
    };
  }

  private emit(change: GameStateChange): void {
    for (const listener of this.listeners) {
      listener(change);
    }
  }
}
