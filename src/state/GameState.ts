import {
  createInitialProspect,
  type ProspectRecord,
  type ProspectStatus,
} from './prospects';

export type GameStateListener = (event: GameStateChange) => void;

export type GameStateChange =
  | { readonly type: 'prospectStatusChanged'; readonly npcId: string; readonly previous: ProspectStatus; readonly next: ProspectStatus };

export interface SerializedGameState {
  readonly tick: number;
  readonly prospects: ReadonlyArray<ProspectRecord>;
}

export class GameState {
  private tick = 0;
  private readonly prospects = new Map<string, ProspectRecord>();
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

  on(listener: GameStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  toJSON(): SerializedGameState {
    return {
      tick: this.tick,
      prospects: this.listProspects().map((p) => ({ ...p })),
    };
  }

  private advanceTick(): number {
    this.tick += 1;
    return this.tick;
  }

  private emit(change: GameStateChange): void {
    for (const listener of this.listeners) {
      listener(change);
    }
  }
}
