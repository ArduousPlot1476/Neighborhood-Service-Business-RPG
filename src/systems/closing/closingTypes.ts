import type { AccountPlan } from '../../state/accounts';
import type { QualificationProfile } from '../../state/prospects';

export type EncounterMeter =
  | 'interest'
  | 'trust'
  | 'budgetFlex'
  | 'urgency'
  | 'marginPressure'
  | 'composure';

export type EncounterMeters = Record<EncounterMeter, number>;

export type EncounterOutcome = 'win' | 'lose' | 'defer';

export const METER_BOUNDS: Readonly<Record<EncounterMeter, { min: number; max: number }>> = {
  interest: { min: 0, max: 100 },
  trust: { min: 0, max: 100 },
  budgetFlex: { min: 0, max: 100 },
  urgency: { min: 0, max: 100 },
  marginPressure: { min: 0, max: 100 },
  composure: { min: 0, max: 100 },
};

export const METER_LABEL: Readonly<Record<EncounterMeter, string>> = {
  interest: 'Interest',
  trust: 'Trust',
  budgetFlex: 'Budget Flex',
  urgency: 'Urgency',
  marginPressure: 'Margin Pressure',
  composure: 'Composure',
};

export type CustomerArchetypeId =
  | 'eager_believer'
  | 'careful_decider'
  | 'pragmatic_holdout'
  | 'skeptical_haggler';

export interface CustomerArchetype {
  readonly id: CustomerArchetypeId;
  readonly name: string;
  readonly tagline: string;
  readonly startingMeters: EncounterMeters;
  readonly preferredPlan: AccountPlan;
  readonly basePriceCents: number;
  readonly priceFloorCents: number;
  readonly openingLine: string;
  readonly winLine: string;
  readonly loseLine: string;
  readonly deferLine: string;
}

export type ActionId =
  | 'ask_need'
  | 'present_service'
  | 'anchor_price'
  | 'offer_reassurance'
  | 'close_now';

export type MeterDelta = Partial<EncounterMeters>;

export interface EncounterAction {
  readonly id: ActionId;
  readonly label: string;
  readonly description: string;
  readonly composureCost: number;
  readonly baseDelta: MeterDelta;
  readonly archetypeMods?: Partial<Record<CustomerArchetypeId, MeterDelta>>;
  readonly reactionByArchetype?: Partial<Record<CustomerArchetypeId, string>>;
  readonly reactionDefault: string;
  readonly terminal?: boolean;
}

export interface ObjectionLine {
  readonly trigger: { readonly meter: EncounterMeter; readonly below: number };
  readonly text: string;
}

export type ObjectionSet = Readonly<Record<CustomerArchetypeId, ReadonlyArray<ObjectionLine>>>;

export interface EncounterInit {
  readonly npcId: string;
  readonly npcName: string;
  readonly npcRole: string;
  readonly profile: QualificationProfile;
  readonly archetype: CustomerArchetype;
}

export interface EncounterViewModel {
  readonly npcName: string;
  readonly npcRole: string;
  readonly archetypeName: string;
  readonly archetypeTagline: string;
  readonly meters: EncounterMeters;
  readonly reactionLine: string;
  readonly turn: number;
  readonly options: ReadonlyArray<{ readonly index: number; readonly id: ActionId; readonly label: string; readonly description: string }>;
  readonly resolved: EncounterOutcome | null;
}

export interface EncounterResult {
  readonly outcome: EncounterOutcome;
  readonly summaryLine: string;
  readonly meters: EncounterMeters;
  readonly turnsUsed: number;
  readonly priceCents: number;
  readonly plan: AccountPlan;
}
