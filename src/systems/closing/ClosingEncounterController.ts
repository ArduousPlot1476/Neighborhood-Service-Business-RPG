import { getAction, listActions } from '../../content/closing/closingActions';
import { pickObjection } from '../../content/closing/objectionSets';
import type {
  ActionId,
  EncounterAction,
  EncounterInit,
  EncounterMeter,
  EncounterMeters,
  EncounterOutcome,
  EncounterResult,
  EncounterViewModel,
  MeterDelta,
} from './closingTypes';
import { METER_BOUNDS } from './closingTypes';

const WIN_REQ = { trust: 60, interest: 65, budgetFlex: 50 } as const;
const LOSE_TRIP = { trust: 25, interest: 25 } as const;

export class ClosingEncounterController {
  private init: EncounterInit | null = null;
  private meters: EncounterMeters = blankMeters();
  private turn = 0;
  private resolution: EncounterOutcome | null = null;
  private reactionLine = '';

  start(init: EncounterInit): EncounterViewModel {
    this.init = init;
    this.meters = { ...init.archetype.startingMeters };
    this.turn = 0;
    this.resolution = null;
    this.reactionLine = init.archetype.openingLine;
    return this.viewModel();
  }

  isActive(): boolean {
    return this.init !== null && this.resolution === null;
  }

  selectAction(index: number): EncounterViewModel {
    if (!this.init || this.resolution !== null) return this.viewModel();
    const actions = listActions();
    if (index < 0 || index >= actions.length) return this.viewModel();
    const action = actions[index]!;
    return this.applyAction(action);
  }

  selectActionById(id: ActionId): EncounterViewModel {
    if (!this.init || this.resolution !== null) return this.viewModel();
    return this.applyAction(getAction(id));
  }

  forceResolve(): EncounterViewModel {
    if (!this.init || this.resolution !== null) return this.viewModel();
    this.resolution = this.computeOutcome();
    this.reactionLine = this.lineForOutcome(this.resolution);
    return this.viewModel();
  }

  walkAway(): EncounterViewModel {
    if (!this.init || this.resolution !== null) return this.viewModel();
    this.resolution = 'defer';
    this.reactionLine = this.lineForOutcome('defer');
    return this.viewModel();
  }

  result(): EncounterResult | null {
    if (!this.init || this.resolution === null) return null;
    const archetype = this.init.archetype;
    const priceCents = this.estimatePrice();
    return {
      outcome: this.resolution,
      summaryLine: this.reactionLine,
      meters: { ...this.meters },
      turnsUsed: this.turn,
      priceCents,
      plan: archetype.preferredPlan,
    };
  }

  view(): EncounterViewModel | null {
    if (!this.init) return null;
    return this.viewModel();
  }

  reset(): void {
    this.init = null;
    this.meters = blankMeters();
    this.turn = 0;
    this.resolution = null;
    this.reactionLine = '';
  }

  private applyAction(action: EncounterAction): EncounterViewModel {
    const init = this.init!;
    this.turn += 1;

    if (action.terminal) {
      this.resolution = this.computeOutcome();
      this.reactionLine = this.lineForOutcome(this.resolution);
      return this.viewModel();
    }

    this.applyDelta(action.baseDelta);
    const mods = action.archetypeMods?.[init.archetype.id];
    if (mods) this.applyDelta(mods);
    this.applyDelta({ composure: -action.composureCost });

    const objection = pickObjection(init.archetype.id, this.meters);
    const baseReaction =
      action.reactionByArchetype?.[init.archetype.id] ?? action.reactionDefault;
    this.reactionLine = objection ? `${baseReaction} ${objection}` : baseReaction;

    if (this.meters.composure <= 0) {
      this.resolution = this.computeOutcome();
      this.reactionLine = this.lineForOutcome(this.resolution);
    }

    return this.viewModel();
  }

  private applyDelta(delta: MeterDelta): void {
    for (const key of Object.keys(delta) as EncounterMeter[]) {
      const change = delta[key];
      if (typeof change !== 'number') continue;
      const bounds = METER_BOUNDS[key];
      this.meters[key] = clamp(this.meters[key] + change, bounds.min, bounds.max);
    }
  }

  private computeOutcome(): EncounterOutcome {
    const m = this.meters;
    if (m.trust <= LOSE_TRIP.trust || m.interest <= LOSE_TRIP.interest) return 'lose';
    if (
      m.trust >= WIN_REQ.trust &&
      m.interest >= WIN_REQ.interest &&
      m.budgetFlex >= WIN_REQ.budgetFlex
    ) {
      return 'win';
    }
    return 'defer';
  }

  private lineForOutcome(outcome: EncounterOutcome): string {
    const archetype = this.init!.archetype;
    switch (outcome) {
      case 'win':
        return archetype.winLine;
      case 'lose':
        return archetype.loseLine;
      case 'defer':
        return archetype.deferLine;
    }
  }

  private estimatePrice(): number {
    const archetype = this.init!.archetype;
    const flex = this.meters.budgetFlex;
    if (this.resolution !== 'win') return archetype.basePriceCents;
    const range = archetype.basePriceCents - archetype.priceFloorCents;
    const flexShare = clamp((flex - 40) / 60, 0, 1);
    const adjusted = archetype.priceFloorCents + Math.round(range * flexShare);
    return clamp(adjusted, archetype.priceFloorCents, archetype.basePriceCents);
  }

  private viewModel(): EncounterViewModel {
    const init = this.init!;
    const actions = listActions();
    return {
      npcName: init.npcName,
      npcRole: init.npcRole,
      archetypeName: init.archetype.name,
      archetypeTagline: init.archetype.tagline,
      meters: { ...this.meters },
      reactionLine: this.reactionLine,
      turn: this.turn,
      options: actions.map((action, i) => ({
        index: i,
        id: action.id,
        label: action.label,
        description: action.description,
      })),
      resolved: this.resolution,
    };
  }
}

function blankMeters(): EncounterMeters {
  return {
    interest: 0,
    trust: 0,
    budgetFlex: 0,
    urgency: 0,
    marginPressure: 0,
    composure: 0,
  };
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
