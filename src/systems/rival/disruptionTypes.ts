import type { AccountRecord } from '../../state/accounts';
import type { DisruptionRecord } from '../../state/disruptions';
import type { JobQuality } from '../../state/jobs';

export interface DisruptionTriggerContext {
  readonly currentDay: number;
  readonly account: AccountRecord;
  readonly hasActiveDisruption: boolean;
  readonly daysSinceLastService: number | null;
}

export interface DisruptionResolutionContext {
  readonly currentDay: number;
  readonly account: AccountRecord;
  readonly disruption: DisruptionRecord;
  readonly latestJobQuality: JobQuality | null;
  readonly latestJobScheduledDay: number | null;
}

export interface DisruptionEventDefinition {
  readonly id: string;
  readonly name: string;
  readonly headline: string;
  readonly bannerLine: string;
  readonly deadlineDays: number;
  readonly initialSatisfactionPenalty: number;
  readonly buildNarrative: (account: AccountRecord) => string;
  readonly canTrigger: (ctx: DisruptionTriggerContext) => boolean;
  readonly resolveOnJobQuality: ReadonlyArray<JobQuality>;
  readonly resolutionLine: (account: AccountRecord) => string;
  readonly expirationLine: (account: AccountRecord) => string;
}

export interface DisruptionDayCloseDigest {
  readonly triggered: ReadonlyArray<DisruptionRecord>;
  readonly resolved: ReadonlyArray<DisruptionRecord>;
  readonly expired: ReadonlyArray<DisruptionRecord>;
  readonly drifted: ReadonlyArray<{ readonly disruption: DisruptionRecord; readonly delta: number }>;
}
