export type ProspectStatus = 'unknown' | 'disqualified' | 'deferred' | 'qualified';

export type ServiceNeed = 'lawn' | 'hedges' | 'beds' | 'mixed' | 'none';
export type BudgetSignal = 'tight' | 'modest' | 'open' | 'unknown';
export type ObjectionStyle = 'terse' | 'chatty' | 'skeptical' | 'friendly';

export interface QualificationProfile {
  readonly serviceNeed: ServiceNeed;
  readonly budgetSignal: BudgetSignal;
  readonly objectionStyle: ObjectionStyle;
}

export interface ProspectRecord {
  readonly npcId: string;
  status: ProspectStatus;
  lastUpdatedTick: number;
  notes: string | null;
}

export function createInitialProspect(npcId: string): ProspectRecord {
  return {
    npcId,
    status: 'unknown',
    lastUpdatedTick: 0,
    notes: null,
  };
}

export const PROSPECT_STATUS_LABEL: Readonly<Record<ProspectStatus, string>> = {
  unknown: 'Unknown',
  disqualified: 'Not a fit',
  deferred: 'Follow up later',
  qualified: 'Qualified',
};

export const PROSPECT_STATUS_COLOR: Readonly<Record<ProspectStatus, number>> = {
  unknown: 0x6e6a64,
  disqualified: 0xa23a1c,
  deferred: 0xd4a019,
  qualified: 0x5a8a3a,
};
