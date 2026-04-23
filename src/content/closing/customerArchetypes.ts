import type { QualificationProfile } from '../../state/prospects';
import type { CustomerArchetype, CustomerArchetypeId } from '../../systems/closing/closingTypes';

const eagerBeliever: CustomerArchetype = {
  id: 'eager_believer',
  name: 'Eager Believer',
  tagline: 'Wants to say yes. Will resent being oversold.',
  startingMeters: {
    interest: 60,
    trust: 55,
    budgetFlex: 65,
    urgency: 50,
    marginPressure: 35,
    composure: 100,
  },
  preferredPlan: 'biweekly_lawn',
  basePriceCents: 5500,
  priceFloorCents: 4500,
  openingLine: "Alright, you're back. Let's see if this is real.",
  winLine: "Done. Get me on the route.",
  loseLine: "Yeah, I changed my mind. Sorry.",
  deferLine: "Let me sit with it. Try me again soon.",
};

const carefulDecider: CustomerArchetype = {
  id: 'careful_decider',
  name: 'Careful Decider',
  tagline: 'Slow yes. Hates pressure. Trust is the whole game.',
  startingMeters: {
    interest: 40,
    trust: 50,
    budgetFlex: 40,
    urgency: 25,
    marginPressure: 30,
    composure: 100,
  },
  preferredPlan: 'seasonal_beds',
  basePriceCents: 7200,
  priceFloorCents: 6000,
  openingLine: "I've been thinking about this. Walk me through it once more.",
  winLine: "Alright. Write it up.",
  loseLine: "I don't think this is the right fit after all.",
  deferLine: "I need a little more time.",
};

const pragmaticHoldout: CustomerArchetype = {
  id: 'pragmatic_holdout',
  name: 'Pragmatic Holdout',
  tagline: 'Numbers-first. Reads soft talk as weakness.',
  startingMeters: {
    interest: 35,
    trust: 35,
    budgetFlex: 30,
    urgency: 35,
    marginPressure: 60,
    composure: 100,
  },
  preferredPlan: 'mixed_monthly',
  basePriceCents: 9000,
  priceFloorCents: 7800,
  openingLine: "Make this quick. What's the number, what's included.",
  winLine: "Fine. Don't make me regret it.",
  loseLine: "Pass.",
  deferLine: "Come back with a sharper pitch.",
};

const skepticalHaggler: CustomerArchetype = {
  id: 'skeptical_haggler',
  name: 'Skeptical Haggler',
  tagline: 'Will probe every line. Treats every price as a starting offer.',
  startingMeters: {
    interest: 30,
    trust: 25,
    budgetFlex: 25,
    urgency: 20,
    marginPressure: 70,
    composure: 100,
  },
  preferredPlan: 'monthly_hedges',
  basePriceCents: 8000,
  priceFloorCents: 6500,
  openingLine: "Let me hear the pitch. I'll tell you where it falls apart.",
  winLine: "Fair enough. Let's try it for a month.",
  loseLine: "Not at that number. Not today.",
  deferLine: "Sleep on it. Come back with something tighter.",
};

const ARCHETYPES: Readonly<Record<CustomerArchetypeId, CustomerArchetype>> = {
  eager_believer: eagerBeliever,
  careful_decider: carefulDecider,
  pragmatic_holdout: pragmaticHoldout,
  skeptical_haggler: skepticalHaggler,
} as const;

export function getArchetype(id: CustomerArchetypeId): CustomerArchetype {
  const archetype = ARCHETYPES[id];
  if (!archetype) {
    throw new Error(`getArchetype: unknown archetype "${id}"`);
  }
  return archetype;
}

export function listArchetypeIds(): ReadonlyArray<CustomerArchetypeId> {
  return Object.keys(ARCHETYPES) as ReadonlyArray<CustomerArchetypeId>;
}

export function deriveArchetypeId(profile: QualificationProfile): CustomerArchetypeId {
  if (profile.objectionStyle === 'friendly' && profile.budgetSignal === 'open') {
    return 'eager_believer';
  }
  if (profile.objectionStyle === 'terse' && profile.budgetSignal === 'tight') {
    return 'pragmatic_holdout';
  }
  if (profile.objectionStyle === 'skeptical') {
    return 'skeptical_haggler';
  }
  return 'careful_decider';
}
