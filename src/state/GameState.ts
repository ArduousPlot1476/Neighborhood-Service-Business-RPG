import type { AccountRecord } from './accounts';
import { createInitialDeal, type DealRecord, type DealStatus } from './deals';
import {
  createInitialProspect,
  type ProspectRecord,
  type ProspectStatus,
} from './prospects';

export type GameStateListener = (event: GameStateChange) => void;

export type GameStateChange =
  | { readonly type: 'prospectStatusChanged'; readonly npcId: string; readonly previous: ProspectStatus; readonly next: ProspectStatus }
  | { readonly type: 'dealStatusChanged'; readonly npcId: string; readonly previous: DealStatus; readonly next: DealStatus }
  | { readonly type: 'accountOpened'; readonly account: AccountRecord };

export interface SerializedGameState {
  readonly tick: number;
  readonly prospects: ReadonlyArray<ProspectRecord>;
  readonly deals: ReadonlyArray<DealRecord>;
  readonly accounts: ReadonlyArray<AccountRecord>;
}

export class GameState {
  private tick = 0;
  private readonly prospects = new Map<string, ProspectRecord>();
  private readonly deals = new Map<string, DealRecord>();
  private readonly accounts = new Map<string, AccountRecord>();
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
      prospects: this.listProspects().map((p) => ({ ...p })),
      deals: this.listDeals().map((d) => ({ ...d })),
      accounts: this.listAccounts().map((a) => ({ ...a })),
    };
  }

  private emit(change: GameStateChange): void {
    for (const listener of this.listeners) {
      listener(change);
    }
  }
}
