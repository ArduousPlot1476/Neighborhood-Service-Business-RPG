# Architecture

This document describes only what exists today (M5). It updates as the game grows.

## Boot flow

```
index.html
  |-- <script type="module" src="/src/main.ts">
main.ts
  |-- createGame('app')                    // src/game/Game.ts
         |-- new Phaser.Game(config)
                |-- scenes: [
                      BootScene,
                      PreloadScene,
                      DistrictScene,
                      ClosingEncounterScene,
                      ServiceJobScene,
                      DayCloseScene,
                    ]

src/game/config.ts is constants only (GAME_WIDTH, GAME_HEIGHT, TILE_SIZE).
Scenes are imported in Game.ts, never in config.ts.
```

`BootScene` immediately hands off to `PreloadScene`. `PreloadScene` generates all runtime textures and starts `DistrictScene`. `DistrictScene` runs `validateContent(...)` at the top of `create()` and throws if anything is missing or dangling.

`DistrictScene` is the hub. It pauses itself when launching `ClosingEncounterScene`, `ServiceJobScene`, or `DayCloseScene`, listens for that scene's one-shot completion event, and resumes when the result handler is done. The `RouteBookOverlay` is in-scene (not a separate Phaser scene) — it's a `scrollFactor=0` widget over `DistrictScene`.

## Rendering

Same as M3/M4 — pixelArt + roundPixels + antialias-off, 640x360 internal, FIT scale, tile size 16. Service yards render in a smaller virtual area centered in the same canvas; they don't have their own tilemap.

## State domains (M5)

Five explicitly separate domains on `GameState`. Each has its own record type, listener events, and slice in `toJSON()`:

| Domain         | File                       | Statuses                                                    | What writes it                                |
| -------------- | -------------------------- | ----------------------------------------------------------- | --------------------------------------------- |
| Qualification  | `state/prospects.ts`       | `unknown / qualified / deferred / disqualified`             | Dialogue effects                              |
| Closing/deal   | `state/deals.ts`           | `none / in_progress / won / lost / deferred`                | `ClosingEncounterScene` result                |
| Accounts       | `state/accounts.ts`        | (presence) + `satisfaction`, `nextDueDay`, `churned`, totals | Encounter result; mutated by job completion + disruption controller |
| Jobs           | `state/jobs.ts`            | `scheduled / in_progress / completed / missed / failed`     | `ServiceJobScene` result, `closeDay()`        |
| Disruptions    | `state/disruptions.ts`     | `active / resolved / expired`                               | `DisruptionController`                        |

State boundaries:

- Closing outcomes never overwrite prospect status.
- Job outcomes never overwrite deal status.
- Disruption status never overwrites job status; it sits *next to* the affected account and uses job-completion quality as a resolution signal, not as a state mutation.
- The only thing on `AccountRecord` that any system writes is satisfaction (via `adjustSatisfaction`) and the cadence anchor (`nextDueDay`, written by `finishJob` and `closeDay` only). Churn is written via the dedicated `churnAccount(...)` method by `DisruptionController` on expiration.

`GameState.toJSON()` returns `{ tick, currentDay, dayState, prospects, deals, accounts, jobs, disruptions }` — all five domains plus the day clock, ready for M6's save/load.

## Cadence rules (M5)

The cadence anchor lives on `AccountRecord.nextDueDay` (a day-index integer). The rules:

- **Account opens.** `nextDueDay = currentDay`. The first job is scheduled by the encounter result handler for the current day.
- **Job completed on day D.** `nextDueDay = job.scheduledDay + plan.cadenceDays`. Cadence resets cleanly from the work that actually happened. Account `lastServicedDay = currentDay`, `jobsCompleted += 1`, satisfaction adjusts by quality delta.
- **Job failed on day D.** `nextDueDay = currentDay + 1`. The property is owed a real visit; cadence does *not* extend. `jobsFailed += 1`, satisfaction drops, `lastServicedDay` is *not* updated (a failed visit isn't a real service event).
- **Job missed at day close.** `nextDueDay = previousDay + 1`. Same catch-up semantics. `jobsMissed += 1`, satisfaction drops.
- **`closeDay()` scheduling.** For each non-churned account whose `nextDueDay <= newDay` and which has no open job, a fresh job is scheduled for `newDay`. This is the only place new jobs spawn from cadence.

The bug being closed: previously `closeDay()` walked the *latest finished* job (any status) and set the next attempt to `lastFinishedJob.scheduledDay + cadenceDays`. A missed job at day 15 with biweekly cadence pushed the next attempt to day 29 — punishing the customer for the player's miss. M5 separates the cadence anchor from the job log so missed/failed work never hides behind cadence.

## Account health (M5)

`AccountRecord.satisfaction` is a 0-100 integer with `ACCOUNT_INITIAL_SATISFACTION = 70`. All adjustments go through `gameState.adjustSatisfaction(accountId, delta, note?)`, which clamps, fires `accountSatisfactionChanged`, and includes both old/new band labels for UI animation hooks.

Deltas live in `state/accounts.ts` as named constants:

- Completed: `pristine +12 / solid +6 / rough -4 / unfinished -8`
- Missed (no-show): `-15`
- Failed (≤5% quality): `-12`
- Disruption resolved: `+10`
- Disruption daily drift while contested: `-4` (each day the doorhanger sits unaddressed)

`riskBandFromSatisfaction(value)` buckets into `healthy (75+) / watch (50-74) / at_risk (25-49) / threatened (0-24)`. Bands surface in the Route Book and gate the disruption-trigger predicate.

## Disruption / rival system (M5)

Same content / logic / view split:

1. **Types** — `src/systems/rival/disruptionTypes.ts` exports `DisruptionEventDefinition`, `DisruptionTriggerContext`, `DisruptionResolutionContext`, `DisruptionDayCloseDigest`. No Phaser imports.
2. **Content** — `src/content/events/disruptionEvents.ts` exports a registry of authored events. Each event has an id, name, headline, narrative builder (a function of the affected account), `deadlineDays`, an `initialSatisfactionPenalty` magnitude, a `canTrigger(ctx)` predicate, a `resolveOnJobQuality` whitelist (the qualities that clear the contest via service), and resolution / expiration lines. M5 ships one event: `ironroot_doorhanger`. Adding more events is content-only — the controller doesn't need changes.
3. **State** — `src/state/disruptions.ts` exports `DisruptionRecord` plus colour/label tables. Records live on `GameState` in their own Map keyed by id; `addDisruption(...)` / `markDisruptionResolved(...)` / `markDisruptionExpired(...)` are the only writers.
4. **Logic** — `src/systems/rival/DisruptionController.ts` (no Phaser deps) has two entry points:
   - `evaluateOnDayClose({ closingDay, nextDay })` — first expires any active disruptions whose deadline has passed (and churns the account), applies daily satisfaction drift to active disruptions that haven't expired, then walks accounts and triggers the first matching authored event for each unaffected account that meets a `canTrigger` predicate. Returns a digest the day-close UI uses.
   - `evaluateOnJobCompletion(job)` — checks the active disruption (if any) for the job's account; if the job's quality is in the event's `resolveOnJobQuality`, marks the disruption resolved and bumps satisfaction.
5. **View** — `RouteBookOverlay` shows active-disruption banner lines, per-row `CONTESTED` / `OVERDUE` tags, and a dedicated "LOST TO IRONROOT" section for churned accounts. `Npc` renders a pulsing `RIVAL` text marker above the head while contested. `DayCloseScene` shows triggered / expired / drifted activity below today's job summary; the teaser line points the player at what to fix tomorrow.

## Day close handoff (updated in M5)

`DistrictScene.openDayClose()` launches `DayCloseScene` with an `onAdvance` callback that returns a `DayCloseAdvanceResult` (`{ summary, disruptions }`). The scene calls `onAdvance()` *immediately on create*, so the panel renders the *post-close* world: today's settled jobs, IronRoot activity that just happened (triggers and expirations), and the schedule for tomorrow. `[E]` then dismisses and returns the player to `EXPLORING`.

The reason for this ordering: the disruption controller needs to run before the player sees the summary, otherwise IronRoot activity wouldn't be visible until the next day. The scene captures the "today's jobs" snapshot *before* calling onAdvance so the per-job line items reflect today's outcomes (which are then settled by `closeDay()` mid-frame).

## Scene state and handoff

`SceneState = 'EXPLORING' | 'DIALOGUE' | 'INFO_PANEL' | 'ENCOUNTER' | 'ROUTE_BOOK' | 'SERVICE_JOB' | 'DAY_CLOSE'`.

`DistrictScene.engage(npc)` router (now five-way):

```
prospect=qualified, deal=won, account.churned                   -> openChurnedPanel        (INFO_PANEL)
prospect=qualified, deal=won, today's job is scheduled          -> launchServiceJob        (SERVICE_JOB)
prospect=qualified, deal=won, no active job today               -> openWonAccountPanel     (INFO_PANEL)
prospect=qualified, deal in {none, deferred}                    -> launchEncounter         (ENCOUNTER)
prospect=qualified, deal=lost                                   -> openLostDealPanel       (INFO_PANEL)
otherwise                                                       -> openDialogue            (DIALOGUE)
```

The contested NPC marker doesn't change the route; an active disruption changes the prompt label ("[E] Win them back") and the urgency, but the gameplay path is still "service their yard."

## Content validation

`validateContent(...)` (now M5) checks all of:

- duplicate NPC ids, missing dialogue ids, dangling option/resume targets (M2/M3)
- prospect seeds with no NPC placement, profiles deriving unknown archetypes (M3)
- service plans with non-positive cadence/payout/zones (M4)
- yard layouts missing their NPC, duplicate yards, empty zone lists, non-positive `secondsToService` (M4)
- disruption events with duplicate ids, non-positive `deadlineDays`, empty `resolveOnJobQuality` (which would make the event unresolvable), or negative `initialSatisfactionPenalty` (the magnitude is expected non-negative; the penalty is applied via `-magnitude`) (M5)

Failure throws `ContentValidationError` at the top of `DistrictScene.create()`.

## Where M6 plugs in

Save/load drops naturally on top of `toJSON()` (already serialises all five domains plus day clock + tick) plus the corresponding constructors that take a serialised shape. The disruption controller's only ephemeral state is the random pick order for `pickFirstEligibleAccount`, which is deterministic enough for M5 — M6 may want to record the chosen account on the disruption record (already stored as `accountId`) so loads are exact.

A second disruption event would slot directly into `disruptionEvents.ts`. The controller already iterates `listDisruptionEvents()` and asks each to `canTrigger(ctx)`, picking the first match per account.
