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
  unknown: 0x8a8575,
  disqualified: 0xc25450,
  deferred: 0xe6b84a,
  qualified: 0x6ec27a,
};
