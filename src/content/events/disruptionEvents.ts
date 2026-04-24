import { riskBandFromSatisfaction } from '../../state/accounts';
import type { DisruptionEventDefinition } from '../../systems/rival/disruptionTypes';

const ironrootDoorhanger: DisruptionEventDefinition = {
  id: 'ironroot_doorhanger',
  name: 'IronRoot doorhanger',
  headline: 'IronRoot left a doorhanger',
  bannerLine: 'IronRoot is contesting an account on your route.',
  deadlineDays: 3,
  initialSatisfactionPenalty: 8,
  buildNarrative: (account) =>
    `${account.npcName} found an IronRoot doorhanger on the porch this morning. Glossy paper, a number ${formatUndercut(account.monthlyValueCents)} below yours, and a same-week start date. They're polite about it, but they want a reason to keep you.`,
  canTrigger: ({ account, hasActiveDisruption }) => {
    if (account.churned) return false;
    if (hasActiveDisruption) return false;
    const band = riskBandFromSatisfaction(account.satisfaction);
    return band === 'watch' || band === 'at_risk' || band === 'threatened';
  },
  resolveOnJobQuality: ['solid', 'pristine'],
  resolutionLine: (account) =>
    `${account.npcName} kept you. The doorhanger is in the recycling.`,
  expirationLine: (account) =>
    `${account.npcName} signed with IronRoot. Your work on this property is done.`,
};

const EVENTS: ReadonlyArray<DisruptionEventDefinition> = [ironrootDoorhanger];

const EVENTS_BY_ID: Readonly<Record<string, DisruptionEventDefinition>> = Object.fromEntries(
  EVENTS.map((e) => [e.id, e]),
);

export function listDisruptionEvents(): ReadonlyArray<DisruptionEventDefinition> {
  return EVENTS;
}

export function getDisruptionEvent(id: string): DisruptionEventDefinition {
  const event = EVENTS_BY_ID[id];
  if (!event) throw new Error(`getDisruptionEvent: unknown event "${id}"`);
  return event;
}

function formatUndercut(monthlyValueCents: number): string {
  const dollars = Math.max(15, Math.round((monthlyValueCents * 0.18) / 100));
  return `$${dollars}`;
}
