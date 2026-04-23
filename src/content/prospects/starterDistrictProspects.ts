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

const PROFILE_BY_ID: Readonly<Record<string, QualificationProfile>> = Object.fromEntries(
  starterDistrictProspects.map((seed) => [seed.npcId, seed.profile]),
);

export function getProspectProfile(npcId: string): QualificationProfile | undefined {
  return PROFILE_BY_ID[npcId];
}
