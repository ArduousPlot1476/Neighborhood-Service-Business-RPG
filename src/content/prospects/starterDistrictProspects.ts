import type { QualificationProfile } from '../../state/prospects';

export interface ProspectSeed {
  readonly npcId: string;
  readonly profile: QualificationProfile;
}

export const starterDistrictProspects: ReadonlyArray<ProspectSeed> = [
  {
    npcId: 'jerry_porter',
    profile: { serviceNeed: 'lawn', budgetSignal: 'open', objectionStyle: 'friendly' },
  },
  {
    npcId: 'linda_ruiz',
    profile: { serviceNeed: 'beds', budgetSignal: 'modest', objectionStyle: 'chatty' },
  },
  {
    npcId: 'marcus_webb',
    profile: { serviceNeed: 'mixed', budgetSignal: 'tight', objectionStyle: 'terse' },
  },
  {
    npcId: 'pat_haller',
    profile: { serviceNeed: 'none', budgetSignal: 'unknown', objectionStyle: 'friendly' },
  },
] as const;
