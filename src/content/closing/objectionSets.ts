import type { CustomerArchetypeId, ObjectionSet } from '../../systems/closing/closingTypes';

export const STARTER_OBJECTIONS: ObjectionSet = {
  eager_believer: [
    { trigger: { meter: 'trust', below: 35 }, text: "Hold on — are you actually going to show up?" },
    { trigger: { meter: 'budgetFlex', below: 30 }, text: "That's a bit more than I was thinking." },
  ],
  careful_decider: [
    { trigger: { meter: 'trust', below: 50 }, text: "I don't know you yet. That matters." },
    { trigger: { meter: 'urgency', below: 20 }, text: "There's no rush, is there?" },
    { trigger: { meter: 'budgetFlex', below: 40 }, text: "I'd want to compare against the other quote." },
  ],
  pragmatic_holdout: [
    { trigger: { meter: 'budgetFlex', below: 35 }, text: "Number's still soft. Sharpen it." },
    { trigger: { meter: 'interest', below: 40 }, text: "I haven't heard the part that's actually for me." },
  ],
  skeptical_haggler: [
    { trigger: { meter: 'trust', below: 30 }, text: "Yeah, I've heard that one before." },
    { trigger: { meter: 'budgetFlex', below: 35 }, text: "What's it cost if I sign today versus next week?" },
    { trigger: { meter: 'marginPressure', below: 50 }, text: "There's room in that price. We both know it." },
  ],
};

export function pickObjection(
  archetype: CustomerArchetypeId,
  meters: Record<string, number>,
): string | null {
  const set = STARTER_OBJECTIONS[archetype];
  if (!set) return null;
  for (const line of set) {
    const value = meters[line.trigger.meter];
    if (typeof value === 'number' && value <= line.trigger.below) {
      return line.text;
    }
  }
  return null;
}
