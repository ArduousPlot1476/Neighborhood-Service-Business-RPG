import { qualityFromScore, type JobQuality } from '../../state/jobs';
import type {
  ServiceJobInit,
  ServiceJobOutcome,
  ServiceJobResult,
  ServiceJobViewModel,
  ZoneRuntime,
} from './serviceJobTypes';

const FAIL_THRESHOLD = 0.05;

export class ServiceJobController {
  private init: ServiceJobInit | null = null;
  private zones: ZoneRuntime[] = [];
  private timerRemaining = 0;
  private timerTotal = 0;
  private resolution: ServiceJobOutcome | null = null;

  start(init: ServiceJobInit): ServiceJobViewModel {
    this.init = init;
    this.zones = init.layout.zones.map((zone) => ({
      zone,
      state: 'pending',
      progressSeconds: 0,
    }));
    this.timerTotal = init.layout.timerSeconds;
    this.timerRemaining = init.layout.timerSeconds;
    this.resolution = null;
    return this.viewModel(null);
  }

  isActive(): boolean {
    return this.init !== null && this.resolution === null;
  }

  tick(args: {
    deltaSeconds: number;
    activeZoneId: string | null;
    isServicing: boolean;
  }): ServiceJobViewModel {
    if (!this.init || this.resolution !== null) return this.viewModel(args.activeZoneId);

    this.timerRemaining = Math.max(0, this.timerRemaining - args.deltaSeconds);

    if (args.activeZoneId && args.isServicing) {
      const runtime = this.zones.find((z) => z.zone.id === args.activeZoneId);
      if (runtime && runtime.state !== 'done') {
        runtime.state = 'in_progress';
        runtime.progressSeconds = Math.min(
          runtime.zone.secondsToService,
          runtime.progressSeconds + args.deltaSeconds,
        );
        if (runtime.progressSeconds >= runtime.zone.secondsToService) {
          runtime.state = 'done';
        }
      }
    }

    if (this.allZonesDone()) {
      this.resolution = 'completed';
    } else if (this.timerRemaining <= 0) {
      this.resolution = this.scoreFraction() <= FAIL_THRESHOLD ? 'failed' : 'completed';
    }

    return this.viewModel(args.activeZoneId);
  }

  forceFinish(): ServiceJobViewModel {
    if (!this.init || this.resolution !== null) return this.viewModel(null);
    this.resolution = this.scoreFraction() <= FAIL_THRESHOLD ? 'failed' : 'completed';
    return this.viewModel(null);
  }

  result(): ServiceJobResult | null {
    if (!this.init || this.resolution === null) return null;
    const score = this.scoreFraction();
    const label: JobQuality = qualityFromScore(score);
    const payout = Math.round(this.init.basePayoutCents * score);
    const zonesCleared = this.zones.filter((z) => z.state === 'done').length;
    return {
      outcome: this.resolution,
      qualityScore: score,
      qualityLabel: label,
      payoutCents: payout,
      zonesCleared,
      zonesTotal: this.zones.length,
      secondsUsed: this.timerTotal - this.timerRemaining,
    };
  }

  zonesSnapshot(): ReadonlyArray<ZoneRuntime> {
    return this.zones.map((z) => ({ ...z }));
  }

  view(activeZoneId: string | null = null): ServiceJobViewModel | null {
    if (!this.init) return null;
    return this.viewModel(activeZoneId);
  }

  reset(): void {
    this.init = null;
    this.zones = [];
    this.timerRemaining = 0;
    this.timerTotal = 0;
    this.resolution = null;
  }

  private viewModel(activeZoneId: string | null): ServiceJobViewModel {
    const init = this.init!;
    const zonesDone = this.zones.filter((z) => z.state === 'done').length;
    const score = this.scoreFraction();
    const projectedPayout = Math.round(init.basePayoutCents * score);
    let currentZoneProgress = 0;
    let currentZoneSeconds = 0;
    if (activeZoneId) {
      const runtime = this.zones.find((z) => z.zone.id === activeZoneId);
      if (runtime) {
        currentZoneProgress = runtime.progressSeconds / runtime.zone.secondsToService;
        currentZoneSeconds = runtime.zone.secondsToService;
      }
    }
    return {
      title: init.layout.title,
      serviceLabel: init.serviceLabel,
      npcName: init.npcName,
      timerRemainingSeconds: this.timerRemaining,
      timerTotalSeconds: this.timerTotal,
      zonesDone,
      zonesTotal: this.zones.length,
      currentZoneId: activeZoneId,
      currentZoneProgress,
      currentZoneSecondsToService: currentZoneSeconds,
      resolved: this.resolution,
      basePayoutCents: init.basePayoutCents,
      projectedPayoutCents: projectedPayout,
      qualityScore: score,
    };
  }

  private scoreFraction(): number {
    if (this.zones.length === 0) return 0;
    let total = 0;
    for (const runtime of this.zones) {
      const ratio = Math.min(1, runtime.progressSeconds / runtime.zone.secondsToService);
      total += ratio;
    }
    return total / this.zones.length;
  }

  private allZonesDone(): boolean {
    return this.zones.every((z) => z.state === 'done');
  }
}
