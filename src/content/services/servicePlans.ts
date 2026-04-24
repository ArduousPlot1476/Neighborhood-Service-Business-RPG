import type { AccountPlan } from '../../state/accounts';

export interface ServicePlan {
  readonly id: AccountPlan;
  readonly cadenceDays: number;
  readonly basePayoutCents: number;
  readonly defaultZoneCount: number;
  readonly serviceLabel: string;
}

const PLANS: Readonly<Record<AccountPlan, ServicePlan>> = {
  biweekly_lawn: {
    id: 'biweekly_lawn',
    cadenceDays: 14,
    basePayoutCents: 5500,
    defaultZoneCount: 4,
    serviceLabel: 'Mow, edge, blow',
  },
  weekly_lawn: {
    id: 'weekly_lawn',
    cadenceDays: 7,
    basePayoutCents: 4500,
    defaultZoneCount: 4,
    serviceLabel: 'Mow + tidy',
  },
  seasonal_beds: {
    id: 'seasonal_beds',
    cadenceDays: 21,
    basePayoutCents: 7200,
    defaultZoneCount: 4,
    serviceLabel: 'Bed weed, edge, refresh mulch',
  },
  monthly_hedges: {
    id: 'monthly_hedges',
    cadenceDays: 30,
    basePayoutCents: 8000,
    defaultZoneCount: 4,
    serviceLabel: 'Trim hedges + cleanup',
  },
  mixed_monthly: {
    id: 'mixed_monthly',
    cadenceDays: 14,
    basePayoutCents: 9000,
    defaultZoneCount: 4,
    serviceLabel: 'Lawn + hedges combo',
  },
};

export function getServicePlan(id: AccountPlan): ServicePlan {
  const plan = PLANS[id];
  if (!plan) throw new Error(`getServicePlan: unknown plan "${id}"`);
  return plan;
}

export function listServicePlans(): ReadonlyArray<ServicePlan> {
  return Object.values(PLANS);
}
