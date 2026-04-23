import type { ActionId, EncounterAction } from '../../systems/closing/closingTypes';

const askNeed: EncounterAction = {
  id: 'ask_need',
  label: 'Ask Need',
  description: 'Open question. Reads the room without committing.',
  composureCost: 8,
  baseDelta: { interest: 6, trust: 6, urgency: 3 },
  archetypeMods: {
    eager_believer: { interest: 3, trust: 4 },
    pragmatic_holdout: { interest: 4, trust: 8 },
    skeptical_haggler: { trust: 10, marginPressure: -3 },
  },
  reactionDefault: "Hm. Let me think about how I'd actually use it.",
  reactionByArchetype: {
    eager_believer: "I told you on the way in — the lawn's killing me.",
    careful_decider: "It would be peace of mind, mostly. Hard to put a number on that.",
    pragmatic_holdout: "Fine question. Means you're listening.",
    skeptical_haggler: "First good question I've heard from one of you.",
  },
};

const presentService: EncounterAction = {
  id: 'present_service',
  label: 'Present Service',
  description: 'Lay out exactly what is included. Concrete, no fluff.',
  composureCost: 14,
  baseDelta: { interest: 12, urgency: 6, marginPressure: -3 },
  archetypeMods: {
    eager_believer: { interest: 14, trust: 5 },
    careful_decider: { interest: 9, trust: 6 },
    pragmatic_holdout: { interest: 10, trust: 5, marginPressure: -5 },
    skeptical_haggler: { interest: 8, marginPressure: -2 },
  },
  reactionDefault: "Okay. That's clearer than the flyer was.",
  reactionByArchetype: {
    eager_believer: "Yeah, that's exactly the thing.",
    careful_decider: "That covers the parts I was worried about.",
    pragmatic_holdout: "Good. I can work with concrete.",
    skeptical_haggler: "Fine. What's missing from that list?",
  },
};

const anchorPrice: EncounterAction = {
  id: 'anchor_price',
  label: 'Anchor Price',
  description: 'State the number first. Direct, no hedging.',
  composureCost: 16,
  baseDelta: { budgetFlex: 12, marginPressure: -5, trust: -2, urgency: 4 },
  archetypeMods: {
    eager_believer: { budgetFlex: 16, trust: 2 },
    careful_decider: { budgetFlex: 6, trust: -6 },
    pragmatic_holdout: { budgetFlex: 18, trust: 6, marginPressure: -8 },
    skeptical_haggler: { budgetFlex: 4, trust: -10, marginPressure: 3 },
  },
  reactionDefault: "Hm. That's higher than I had in my head.",
  reactionByArchetype: {
    eager_believer: "That's reasonable. I was bracing for worse.",
    careful_decider: "I'll need to talk that over. It's not a no.",
    pragmatic_holdout: "Good. You didn't dance around it.",
    skeptical_haggler: "And what's the real number, after we negotiate?",
  },
};

const offerReassurance: EncounterAction = {
  id: 'offer_reassurance',
  label: 'Offer Reassurance',
  description: 'Address the worry behind the question. Lower the stakes.',
  composureCost: 12,
  baseDelta: { trust: 12, urgency: -3 },
  archetypeMods: {
    eager_believer: { trust: 18, interest: 4 },
    careful_decider: { trust: 16, interest: 4 },
    pragmatic_holdout: { trust: 4, interest: -2 },
    skeptical_haggler: { trust: 2, marginPressure: 2 },
  },
  reactionDefault: "That helps. A little.",
  reactionByArchetype: {
    eager_believer: "Yeah, see, that's why I want to do this.",
    careful_decider: "Thank you. That was the part I was stuck on.",
    pragmatic_holdout: "Spare me the soft talk. Get to the offer.",
    skeptical_haggler: "Promises are cheap. We'll see.",
  },
};

const closeNow: EncounterAction = {
  id: 'close_now',
  label: 'Close Now',
  description: 'Ask for the commitment. Resolves the encounter.',
  composureCost: 0,
  baseDelta: {},
  reactionDefault: "Alright. Here's where I land.",
  terminal: true,
};

const ACTIONS: ReadonlyArray<EncounterAction> = [
  askNeed,
  presentService,
  anchorPrice,
  offerReassurance,
  closeNow,
];

const ACTIONS_BY_ID: Readonly<Record<ActionId, EncounterAction>> = {
  ask_need: askNeed,
  present_service: presentService,
  anchor_price: anchorPrice,
  offer_reassurance: offerReassurance,
  close_now: closeNow,
};

export function listActions(): ReadonlyArray<EncounterAction> {
  return ACTIONS;
}

export function getAction(id: ActionId): EncounterAction {
  const action = ACTIONS_BY_ID[id];
  if (!action) throw new Error(`getAction: unknown action "${id}"`);
  return action;
}
