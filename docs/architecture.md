# Architecture

This document describes only what exists today (M6). The vertical slice is feature-complete.

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

`BootScene` immediately hands off to `PreloadScene`. `PreloadScene` generates all runtime textures and starts `DistrictScene`. `DistrictScene.create()` runs `validateContent(...)` and then attempts `readSave()` from localStorage. If the save is `ok` the scene rehydrates `GameState` from the envelope; on `corrupt` or `incompatible` it auto-clears the save, surfaces a toast, and starts fresh; on `missing` it constructs a new state and seeds prospects.

`DistrictScene` is the hub. It pauses itself when launching `ClosingEncounterScene`, `ServiceJobScene`, or `DayCloseScene`, listens for that scene's one-shot completion event, and resumes when the result handler is done. The `RouteBookOverlay` is in-scene (not a separate Phaser scene) — it's a `scrollFactor=0` widget over `DistrictScene`.

## Rendering

Same as M3-M5 — pixelArt + roundPixels + antialias-off, 640x360 internal, FIT scale, tile size 16. Service yards render in a smaller virtual area centered in the same canvas; they don't have their own tilemap.

## State domains (M6)

Five explicitly separate domains on `GameState`, plus a day clock. Each has its own record type, listener events, and slice in `toJSON()`:

| Domain         | File                       | Statuses                                                    | What writes it                                |
| -------------- | -------------------------- | ----------------------------------------------------------- | --------------------------------------------- |
| Qualification  | `state/prospects.ts`       | `unknown / qualified / deferred / disqualified`             | Dialogue effects                              |
| Closing/deal   | `state/deals.ts`           | `none / in_progress / won / lost / deferred`                | `ClosingEncounterScene` result                |
| Accounts       | `state/accounts.ts`        | (presence) + `satisfaction`, `nextDueDay`, `churned`, totals | Encounter result; mutated by job completion + disruption controller |
| Jobs           | `state/jobs.ts`            | `scheduled / in_progress / completed / missed / failed`     | `ServiceJobScene` result, `closeDay()`        |
| Disruptions    | `state/disruptions.ts`     | `active / resolved / expired`                               | `DisruptionController`                        |

State boundaries are enforced by which methods exist where:

- Closing outcomes never overwrite prospect status.
- Job outcomes never overwrite deal status.
- Disruption status never overwrites job status; it sits *next to* the affected account and uses job-completion quality as a resolution signal, not as a state mutation.
- Account satisfaction and `nextDueDay` are written through dedicated methods (`adjustSatisfaction`, `finishJob`, `closeDay`); churn flows through `churnAccount(...)` only.

`GameState.toJSON()` returns `{ tick, currentDay, dayState, prospects, deals, accounts, jobs, disruptions }`. `GameState.fromSerialized(payload)` is the inverse — it rebuilds every Map from the array, restores `tick`/`currentDay`/`dayState`, derives `jobIdCounter` and `disruptionIdCounter` from the max parsed id, and applies safe defaults for any optional/missing fields (so a save that pre-dates a field addition still loads).

## Cadence rules (M5, unchanged in M6)

The cadence anchor lives on `AccountRecord.nextDueDay` (a day-index integer). The rules:

- **Account opens.** `nextDueDay = currentDay`. The first job is scheduled by the encounter result handler for the current day.
- **Job completed on day D.** `nextDueDay = job.scheduledDay + plan.cadenceDays`. Cadence resets cleanly from the work that actually happened. Account `lastServicedDay = currentDay`, `jobsCompleted += 1`, satisfaction adjusts by quality delta.
- **Job failed on day D.** `nextDueDay = currentDay + 1`. The property is owed a real visit; cadence does *not* extend. `jobsFailed += 1`, satisfaction drops, `lastServicedDay` is not updated.
- **Job missed at day close.** `nextDueDay = previousDay + 1`. Same catch-up semantics. `jobsMissed += 1`, satisfaction drops.
- **`closeDay()` scheduling.** For each non-churned account whose `nextDueDay <= newDay` and which has no open job, a fresh job is scheduled for `newDay`.

## Account health (M5, tightened in M6)

`AccountRecord.satisfaction` is a 0-100 integer. `ACCOUNT_INITIAL_SATISFACTION = 78` (validated by `validateContent` to fall in the `healthy` band, so a brand-new account can't auto-trigger a doorhanger at the next day close). All adjustments go through `gameState.adjustSatisfaction(accountId, delta, note?)`, which clamps, fires `accountSatisfactionChanged`, and includes both old/new band labels.

Deltas live in `state/accounts.ts` as named constants:

- Completed: `pristine +12 / solid +6 / rough -4 / unfinished -8`
- Missed (no-show): `-15`
- Failed (≤5% quality): `-12`
- Disruption resolved: `+10`
- Disruption daily drift while contested: `-4`

`riskBandFromSatisfaction(value)` buckets into `healthy (75+) / watch (50-74) / at_risk (25-49) / threatened (0-24)`. Bands surface in the Route Book and gate the disruption-trigger predicate.

## Disruption / rival system (M5, unchanged in M6)

Same content / logic / view split:

1. **Types** — `src/systems/rival/disruptionTypes.ts`. No Phaser imports.
2. **Content** — `src/content/events/disruptionEvents.ts` registry. M5 ships one event: `ironroot_doorhanger`. Adding more events is content-only.
3. **State** — `src/state/disruptions.ts` exports `DisruptionRecord`. Records live on `GameState`; only `addDisruption / markDisruptionResolved / markDisruptionExpired` write them.
4. **Logic** — `src/systems/rival/DisruptionController.ts` with two entry points:
   - `evaluateOnDayClose({ closingDay, nextDay })` — expires past-deadline disruptions (and churns the affected account), drifts active disruptions, then walks accounts and triggers the first matching authored event for each unaffected eligible account
   - `evaluateOnJobCompletion(job)` — clears any active disruption on the job's account if the quality is in the event's `resolveOnJobQuality`
5. **View** — `RouteBookOverlay` shows active-disruption banner lines, per-row `CONTESTED` / `OVERDUE` tags, and a dedicated "LOST TO IRONROOT" section. `Npc` renders a pulsing `RIVAL` text marker. `DayCloseScene` shows triggered / expired / drifted activity.

## Save / load (M6)

### Schema

`src/state/saveSchema.ts`:

```ts
export const SAVE_SCHEMA_VERSION = 1;

export interface SaveEnvelope {
  schemaVersion: number;     // bump on incompatible payload changes
  appVersion: string;        // for telemetry / debugging only
  savedAt: number;           // Date.now() ms
  payload: SerializedGameState;  // tick + day clock + 5 domain arrays
}
```

The envelope is intentionally separate from the payload so we can change app metadata without touching schema-version handling, and so the version check is the first thing the loader does.

### Storage

`src/state/saveSystem.ts` exposes:

```ts
hasSavedGame(): boolean
writeSave(state: GameState): { status: 'ok'|'unsupported'|'error', ... }
readSave(): { status: 'ok'|'missing'|'corrupt'|'incompatible', ... }
clearSave(): { status: 'ok'|'error', ... }
```

All entry points return tagged outcomes (no exceptions for "missing" / "corrupt" / version mismatch). The localStorage key is `nrpg:save:v1`; the `:v1` suffix lets us add `:v2` later without colliding. Storage availability is probed on every call so private-mode browsers degrade gracefully.

Corrupt and incompatible saves are auto-cleared at load time so the game can never get stuck on a stale envelope.

### Rehydration

`GameState.fromSerialized(payload)` is a static factory. It:

1. Constructs a fresh `GameState`
2. Restores `tick`, `currentDay`, `dayState` (with sane fallbacks)
3. Walks each domain array, copies records into the corresponding Map, and applies `??` defaults for any optional or recently-added fields
4. Derives `jobIdCounter` and `disruptionIdCounter` from the max numeric id parsed (so newly-spawned jobs/disruptions after load don't collide)
5. Skips event emission deliberately — listeners are wired *after* construction

This is the only path that bypasses the change-event hooks. Everything that mutates state at runtime (encounter result handler, job result handler, day-close advance, disruption controller) goes through the regular methods and emits events as usual.

### UX flow

- **Start.** `DistrictScene.create()` calls `readSave()` after `validateContent`. On `ok` the scene rehydrates and shows a `Save loaded — Day N (~Xs ago)` toast. On `corrupt` / `incompatible` it clears the save and shows a red `Save unreadable — starting fresh` toast.
- **Manual save.** `S` in the Route Book calls `writeSave(this.gameState)` and toasts the result. The Route Book footer hint reads `[S] save`.
- **Auto-save.** After `DayCloseScene` emits `dayclose:done`, `DistrictScene` runs the same `writeSave` and toasts `Auto-saved`.
- **Reset.** `Shift+R` in the Route Book calls `clearSave()` and toasts `Save cleared — refresh to start fresh`. The footer hint includes `[Shift+R] clear save` only when a save exists.

### Visual state restoration

After `fromSerialized` runs, `DistrictScene.create()` walks the NPCs and:

- Calls `npc.setStatus(getProspectStatus)` from the rehydrated prospect map
- Calls `refreshJobMarkers()` to set `!` markers based on day-D scheduled jobs
- Calls `refreshContestedMarkers()` to set `RIVAL` markers based on active disruptions
- Calls `refreshDayBanner()` to display the loaded current day

The prompt label uses `npc.hasJobReady` and `npc.isContested` plus live state lookups, so contested + churned + ready states all read correctly the moment the player walks up to an NPC after a load.

## Day close handoff (unchanged in M6)

`DistrictScene.openDayClose()` launches `DayCloseScene` with an `onAdvance` callback that returns `{ summary, disruptions }`. The scene calls `onAdvance()` on create so the panel renders the post-close world. After the player presses `[E]`, the scene emits `dayclose:done` and stops; `DistrictScene` resumes and triggers an auto-save.

## Scene state

`SceneState = 'EXPLORING' | 'DIALOGUE' | 'INFO_PANEL' | 'ENCOUNTER' | 'ROUTE_BOOK' | 'SERVICE_JOB' | 'DAY_CLOSE'`.

`DistrictScene.engage(npc)` router (unchanged in M6):

```
prospect=qualified, deal=won, account.churned                   -> openChurnedPanel        (INFO_PANEL)
prospect=qualified, deal=won, today's job is scheduled          -> launchServiceJob        (SERVICE_JOB)
prospect=qualified, deal=won, no active job today               -> openWonAccountPanel     (INFO_PANEL, contest-aware)
prospect=qualified, deal in {none, deferred}                    -> launchEncounter         (ENCOUNTER)
prospect=qualified, deal=lost                                   -> openLostDealPanel       (INFO_PANEL)
otherwise                                                       -> openDialogue            (DIALOGUE)
```

`openWonAccountPanel` now reads any active disruption on the account and prepends the IronRoot narrative + days-remaining to the standard health line.

## Content validation (M6)

`validateContent(...)` checks all of:

- duplicate NPC ids, missing dialogue ids, dangling option/resume targets (M2/M3)
- prospect seeds with no NPC placement, profiles deriving unknown archetypes (M3)
- service plans with non-positive cadence/payout/zones (M4)
- yard layouts missing their NPC, duplicate yards, empty zone lists, non-positive `secondsToService` (M4)
- disruption events with duplicate ids, non-positive deadlines, empty `resolveOnJobQuality`, or negative `initialSatisfactionPenalty` (M5)
- **`ACCOUNT_INITIAL_SATISFACTION` puts new accounts in the `healthy` band** so they can't auto-trigger a doorhanger at the next day close (M6)

Failure throws `ContentValidationError` at the top of `DistrictScene.create()`.

## Slice is feature-complete

The vertical slice covers exploration → qualification → close → service → day cycle → account health → rival pressure → save/load. Post-slice work lives in [`milestones.md`](milestones.md) and is not architecturally coupled to anything in M1-M6.
