export type AccountPlan =
  | 'biweekly_lawn'
  | 'weekly_lawn'
  | 'seasonal_beds'
  | 'monthly_hedges'
  | 'mixed_monthly';

export interface AccountRecord {
  readonly id: string;
  readonly npcId: string;
  readonly npcName: string;
  readonly plan: AccountPlan;
  readonly monthlyValueCents: number;
  readonly openedTick: number;
  readonly openingNotes: string | null;
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
