import type { JobQuality } from '../../state/jobs';
import type { YardLayout, YardZone } from '../../content/jobs/starterJobs';

export interface ServiceJobInit {
  readonly jobId: string;
  readonly accountId: string;
  readonly npcId: string;
  readonly npcName: string;
  readonly servicePlanId: string;
  readonly basePayoutCents: number;
  readonly serviceLabel: string;
  readonly layout: YardLayout;
}

export type ZoneState = 'pending' | 'in_progress' | 'done';

export interface ZoneRuntime {
  readonly zone: YardZone;
  state: ZoneState;
  progressSeconds: number;
}

export interface ServiceJobViewModel {
  readonly title: string;
  readonly serviceLabel: string;
  readonly npcName: string;
  readonly timerRemainingSeconds: number;
  readonly timerTotalSeconds: number;
  readonly zonesDone: number;
  readonly zonesTotal: number;
  readonly currentZoneId: string | null;
  readonly currentZoneProgress: number;
  readonly currentZoneSecondsToService: number;
  readonly resolved: ServiceJobOutcome | null;
  readonly basePayoutCents: number;
  readonly projectedPayoutCents: number;
  readonly qualityScore: number;
}

export type ServiceJobOutcome = 'completed' | 'failed';

export interface ServiceJobResult {
  readonly outcome: ServiceJobOutcome;
  readonly qualityScore: number;
  readonly qualityLabel: JobQuality;
  readonly payoutCents: number;
  readonly zonesCleared: number;
  readonly zonesTotal: number;
  readonly secondsUsed: number;
}
