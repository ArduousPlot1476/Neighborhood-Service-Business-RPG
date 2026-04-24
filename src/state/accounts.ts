import type { JobQuality } from './jobs';

export type AccountPlan =
  | 'biweekly_lawn'
  | 'weekly_lawn'
  | 'seasonal_beds'
  | 'monthly_hedges'
  | 'mixed_monthly';

export type AccountRiskBand = 'healthy' | 'watch' | 'at_risk' | 'threatened';

export interface AccountRecord {
  readonly id: string;
  readonly npcId: string;
  readonly npcName: string;
  readonly plan: AccountPlan;
  readonly monthlyValueCents: number;
  readonly openedTick: number;
  readonly openingNotes: string | null;
  lastServicedDay: number | null;
  totalEarnedCents: number;
  jobsCompleted: number;
  jobsMissed: number;
  jobsFailed: number;
  satisfaction: number;
  nextDueDay: number;
  churned: boolean;
  churnedDay: number | null;
}

export const ACCOUNT_PLAN_LABEL: Readonly<Record<AccountPlan, string>> = {
  biweekly_lawn: 'Biweekly lawn',
  weekly_lawn: 'Weekly lawn',
  seasonal_beds: 'Seasonal bed work',
  monthly_hedges: 'Monthly hedge service',
  mixed_monthly: 'Mixed monthly plan',
};

export function formatMonthlyValue(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toFixed(0)}/mo`;
}

export function formatDollars(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toFixed(0)}`;
}

export const ACCOUNT_INITIAL_SATISFACTION = 78;
export const ACCOUNT_SATISFACTION_MAX = 100;
export const ACCOUNT_SATISFACTION_MIN = 0;

const COMPLETED_DELTA: Readonly<Record<JobQuality, number>> = {
  pristine: 12,
  solid: 6,
  rough: -4,
  unfinished: -8,
};

const MISSED_DELTA = -15;
const FAILED_DELTA = -12;
const CONTEST_RESOLVED_BONUS = 10;
const CONTEST_DAILY_DRIFT = -4;

export function satisfactionDeltaForCompletedJob(quality: JobQuality): number {
  return COMPLETED_DELTA[quality];
}

export function satisfactionDeltaForMissedJob(): number {
  return MISSED_DELTA;
}

export function satisfactionDeltaForFailedJob(): number {
  return FAILED_DELTA;
}

export function satisfactionDeltaForResolvedContest(): number {
  return CONTEST_RESOLVED_BONUS;
}

export function satisfactionDeltaForDailyContestDrift(): number {
  return CONTEST_DAILY_DRIFT;
}

export function clampSatisfaction(value: number): number {
  if (value < ACCOUNT_SATISFACTION_MIN) return ACCOUNT_SATISFACTION_MIN;
  if (value > ACCOUNT_SATISFACTION_MAX) return ACCOUNT_SATISFACTION_MAX;
  return value;
}

export function riskBandFromSatisfaction(satisfaction: number): AccountRiskBand {
  if (satisfaction >= 75) return 'healthy';
  if (satisfaction >= 50) return 'watch';
  if (satisfaction >= 25) return 'at_risk';
  return 'threatened';
}

export const RISK_BAND_LABEL: Readonly<Record<AccountRiskBand, string>> = {
  healthy: 'Healthy',
  watch: 'Watch',
  at_risk: 'At risk',
  threatened: 'Threatened',
};

export const RISK_BAND_COLOR: Readonly<Record<AccountRiskBand, number>> = {
  healthy: 0x6ec27a,
  watch: 0xe6b84a,
  at_risk: 0xe69240,
  threatened: 0xc25450,
};

export const RISK_BAND_HEX: Readonly<Record<AccountRiskBand, string>> = {
  healthy: '#7fd49b',
  watch: '#f0c878',
  at_risk: '#e6a060',
  threatened: '#e08a85',
};
