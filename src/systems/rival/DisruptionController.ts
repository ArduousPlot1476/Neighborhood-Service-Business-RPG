import {
  listDisruptionEvents,
  getDisruptionEvent,
} from '../../content/events/disruptionEvents';
import type { GameState } from '../../state/GameState';
import {
  satisfactionDeltaForDailyContestDrift,
  satisfactionDeltaForResolvedContest,
} from '../../state/accounts';
import type { DisruptionRecord } from '../../state/disruptions';
import type { JobRecord } from '../../state/jobs';
import type {
  DisruptionDayCloseDigest,
  DisruptionEventDefinition,
} from './disruptionTypes';

export class DisruptionController {
  constructor(private readonly state: GameState) {}

  evaluateOnDayClose(args: {
    closingDay: number;
    nextDay: number;
  }): DisruptionDayCloseDigest {
    const triggered: DisruptionRecord[] = [];
    const resolved: DisruptionRecord[] = [];
    const expired: DisruptionRecord[] = [];
    const drifted: { disruption: DisruptionRecord; delta: number }[] = [];

    for (const disruption of this.state.listDisruptions()) {
      if (disruption.status !== 'active') continue;
      if (disruption.deadlineDay <= args.closingDay) {
        this.expire(disruption);
        expired.push(disruption);
        continue;
      }
      const driftDelta = satisfactionDeltaForDailyContestDrift();
      this.state.adjustSatisfaction(disruption.accountId, driftDelta, `Disruption drift: ${disruption.eventId}`);
      drifted.push({ disruption, delta: driftDelta });
    }

    const events = listDisruptionEvents();
    for (const account of this.state.listAccounts()) {
      if (account.churned) continue;
      const hasActive = !!this.state.getActiveDisruptionForAccount(account.id);
      if (hasActive) continue;
      const ctx = {
        currentDay: args.nextDay,
        account,
        hasActiveDisruption: false,
        daysSinceLastService: account.lastServicedDay !== null ? args.nextDay - account.lastServicedDay : null,
      };
      const event = events.find((e) => e.canTrigger(ctx));
      if (!event) continue;
      const record = this.spawnDisruption(event, args.nextDay);
      triggered.push(record);
    }

    return {
      triggered,
      resolved,
      expired,
      drifted,
    };
  }

  evaluateOnJobCompletion(job: JobRecord): DisruptionRecord | null {
    if (!job.quality) return null;
    const disruption = this.state.getActiveDisruptionForAccount(job.accountId);
    if (!disruption) return null;
    const event = getDisruptionEvent(disruption.eventId);
    if (!event.resolveOnJobQuality.includes(job.quality)) return null;
    this.resolve(disruption);
    this.state.adjustSatisfaction(
      job.accountId,
      satisfactionDeltaForResolvedContest(),
      `Disruption resolved: ${disruption.eventId}`,
    );
    return disruption;
  }

  private spawnDisruption(event: DisruptionEventDefinition, currentDay: number): DisruptionRecord {
    const account = pickFirstEligibleAccount(this.state, event, currentDay)!;
    const narrative = event.buildNarrative(account);
    const record = this.state.addDisruption({
      eventId: event.id,
      accountId: account.id,
      npcId: account.npcId,
      triggeredDay: currentDay,
      deadlineDay: currentDay + event.deadlineDays,
      narrative,
    });
    if (event.initialSatisfactionPenalty > 0) {
      this.state.adjustSatisfaction(
        account.id,
        -event.initialSatisfactionPenalty,
        `Disruption hit: ${event.id}`,
      );
    }
    return record;
  }

  private expire(disruption: DisruptionRecord): void {
    this.state.markDisruptionExpired(disruption.id, this.state.getCurrentDay());
    this.state.churnAccount(disruption.accountId, this.state.getCurrentDay());
  }

  private resolve(disruption: DisruptionRecord): void {
    this.state.markDisruptionResolved(disruption.id, this.state.getCurrentDay());
  }
}

function pickFirstEligibleAccount(
  state: GameState,
  event: DisruptionEventDefinition,
  currentDay: number,
): ReturnType<GameState['listAccounts']>[number] | undefined {
  for (const account of state.listAccounts()) {
    if (account.churned) continue;
    if (state.getActiveDisruptionForAccount(account.id)) continue;
    const ctx = {
      currentDay,
      account,
      hasActiveDisruption: false,
      daysSinceLastService:
        account.lastServicedDay !== null ? currentDay - account.lastServicedDay : null,
    };
    if (event.canTrigger(ctx)) return account;
  }
  return undefined;
}
