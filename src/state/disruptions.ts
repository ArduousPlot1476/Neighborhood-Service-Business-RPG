export type DisruptionStatus = 'active' | 'resolved' | 'expired';
export type DisruptionResolution = 'won_back' | 'lost_to_rival' | 'pending';

export interface DisruptionRecord {
  readonly id: string;
  readonly eventId: string;
  readonly accountId: string;
  readonly npcId: string;
  readonly triggeredDay: number;
  deadlineDay: number;
  status: DisruptionStatus;
  resolution: DisruptionResolution;
  narrative: string;
  resolvedDay: number | null;
}

export const DISRUPTION_STATUS_LABEL: Readonly<Record<DisruptionStatus, string>> = {
  active: 'Active',
  resolved: 'Won back',
  expired: 'Lost',
};

export const DISRUPTION_STATUS_COLOR: Readonly<Record<DisruptionStatus, number>> = {
  active: 0xa23a1c,
  resolved: 0x5a8a3a,
  expired: 0x6e6a64,
};

export const DISRUPTION_STATUS_HEX: Readonly<Record<DisruptionStatus, string>> = {
  active: '#e08a85',
  resolved: '#7fd49b',
  expired: '#9a9a9a',
};

export function createDisruptionRecord(args: {
  id: string;
  eventId: string;
  accountId: string;
  npcId: string;
  triggeredDay: number;
  deadlineDay: number;
  narrative: string;
}): DisruptionRecord {
  return {
    id: args.id,
    eventId: args.eventId,
    accountId: args.accountId,
    npcId: args.npcId,
    triggeredDay: args.triggeredDay,
    deadlineDay: args.deadlineDay,
    status: 'active',
    resolution: 'pending',
    narrative: args.narrative,
    resolvedDay: null,
  };
}
