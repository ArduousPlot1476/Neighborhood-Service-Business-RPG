export type DealStatus =
  | 'none'
  | 'in_progress'
  | 'won'
  | 'lost'
  | 'deferred';

export interface DealRecord {
  readonly npcId: string;
  status: DealStatus;
  attempts: number;
  lastOutcome: DealStatus | null;
  lastUpdatedTick: number;
  notes: string | null;
}

export function createInitialDeal(npcId: string): DealRecord {
  return {
    npcId,
    status: 'none',
    attempts: 0,
    lastOutcome: null,
    lastUpdatedTick: 0,
    notes: null,
  };
}

export const DEAL_STATUS_LABEL: Readonly<Record<DealStatus, string>> = {
  none: 'No deal yet',
  in_progress: 'Negotiating',
  won: 'Account opened',
  lost: 'Deal lost',
  deferred: 'Re-pitch later',
};

export const DEAL_STATUS_COLOR: Readonly<Record<DealStatus, number>> = {
  none: 0x8a8575,
  in_progress: 0x6aa8d9,
  won: 0x6ec27a,
  lost: 0xc25450,
  deferred: 0xe6b84a,
};
