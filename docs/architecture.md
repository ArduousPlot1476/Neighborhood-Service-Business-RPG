# Architecture

This document describes only what exists today (M4). It updates as the game grows.

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

Same as M3 — pixelArt + roundPixels + antialias-off, 640x360 internal, FIT scale, tile size 16. Service yards render in a smaller virtual area centered in the same canvas; they don't have their own tilemap, just a coloured grass rectangle and zone rectangles drawn directly.

## State domains (M4)

Four explicitly separate domains on `GameState`. Each has its own record type, listener event, and slice in `toJSON()`:

| Domain         | File                  | Statuses                                                    | What writes it                       |
| -------------- | --------------------- | ----------------------------------------------------------- | ------------------------------------ |
| Qualification  | `state/prospects.ts`  | `unknown / qualified / deferred / disqualified`             | Dialogue effects                     |
| Closing/deal   | `state/deals.ts`      | `none / in_progress / won / lost / deferred`                | `ClosingEncounterScene` result       |
| Accounts       | `state/accounts.ts`   | (presence = open) + `lastServicedDay`, `totalEarnedCents`, `jobsCompleted` | `gameState.openAccount(...)` on win, mutated on job completion |
| Jobs           | `state/jobs.ts`       | `scheduled / in_progress / completed / missed / failed`     | `ServiceJobScene` result, `closeDay()` |

Closing outcomes never overwrite prospect status. Job outcomes never overwrite deal status. The only place all four are combined is `DistrictScene.engage(npc)`, which reads prospect, deal, and (if won) the day's job to decide what UI to open.

`GameState` also owns the day model: `currentDay: number` (starts at 1), `dayState: 'in_progress' | 'closed'`, and `closeDay()` which marks today's still-`scheduled` jobs as `missed`, advances the day, and rolls new scheduled jobs for any account whose plan cadence has come due.

`toJSON()` returns `{ tick, currentDay, dayState, prospects, deals, accounts, jobs }` — all four domains plus the day clock, ready for M7's save/load.

## Dialogue + closing systems (M2-M3 — unchanged)

Both still follow the **content / logic / view** split documented in earlier milestones. M4 added no new dialogue or closing types. The closing scene remains the only thing that writes `deals`; it does not know about `jobs` or `accounts` directly. The encounter result handler in `DistrictScene` is the bridge that turns a `win` into both an account *and* a first scheduled job.

## Service-job system (M4)

Same content / logic / view split:

1. **Types** — `src/systems/service/serviceJobTypes.ts` exports `ServiceJobInit`, `ServiceJobViewModel`, `ServiceJobResult`, `ZoneRuntime`, `ServiceJobOutcome`. No Phaser imports.
2. **Content** —
   - `src/content/services/servicePlans.ts` — registry of `AccountPlan -> ServicePlan { cadenceDays, basePayoutCents, defaultZoneCount, serviceLabel }`.
   - `src/content/jobs/starterJobs.ts` — per-NPC `YardLayout` ({ widthTiles, heightTiles, playerSpawn, timerSeconds, zones[] }). Zones carry `kind`, position, size, `secondsToService`, and a label.
3. **Logic** — `src/systems/service/ServiceJobController.ts` walks the encounter (no Phaser). Each `tick(dt, activeZoneId, isServicing)` advances the timer, accumulates progress on the active zone if servicing, recomputes the projected score (sum of clamped per-zone ratios / total zones), and resolves on timer-zero or all-zones-done. `walkAway()` style finish via `forceFinish()` exists for `Esc`.
4. **View** — `src/scenes/ServiceJobScene.ts` renders the HUD (timer bar, zones cleared, projected payout) and the yard (grass + coloured zone rectangles + per-zone progress bars). The player sprite is a non-physics `GameObject.Sprite` with manually clamped movement; the scene does not need a tilemap or arcade collisions for a 4-zone slice.

Outcome: `completed` if all zones cleared OR timer expired with score above the failure floor (5%); `failed` otherwise. `qualityFromScore(score)` buckets the float into `unfinished | rough | solid | pristine`. Payout is `round(basePayoutCents * score)`.

When the scene resolves the player presses `E` to dismiss; the scene emits `service:result` and stops itself; `DistrictScene` receives the payload, calls `gameState.finishJob(...)` (which also updates the account's `totalEarnedCents`, `lastServicedDay`, and `jobsCompleted`), resumes, and surfaces a toast.

## Route Book + day cycle (M4)

`RouteBookOverlay` is an in-scene UI widget, not a Phaser scene. It reads from `GameState` directly on each `show()`/`refresh()` — no caching. Per-account row shows: customer name, plan label, monthly value, total earned, last serviced day, and today's job status. Header carries day number, account count, total recurring, lifetime earned. Footer shows a contextual hint (jobs still scheduled today, etc.).

`Tab` toggles the overlay; `Esc` also closes it. While `ROUTE_BOOK` state is active, movement is locked. `N` ends the day from any non-modal state — from exploration directly, or from inside the route book.

`DayCloseScene` is a real Phaser scene (paused-launch pattern same as the encounter). It reads `state.getJobsForDay(currentDay)` to build the per-job summary, then on `[E]` calls the `onAdvance` callback (which calls `state.closeDay()`) and stops. `closeDay()` marks unattended scheduled jobs as `missed`, advances the day counter, and schedules next jobs for any account whose plan cadence has come due since their last finished job.

## Scene state and handoff

`SceneState = 'EXPLORING' | 'DIALOGUE' | 'INFO_PANEL' | 'ENCOUNTER' | 'ROUTE_BOOK' | 'SERVICE_JOB' | 'DAY_CLOSE'`.

`DistrictScene.engage(npc)` router (now four-way):

```
prospect == 'qualified' AND deal == 'won' AND today's job is scheduled  -> launchServiceJob
prospect == 'qualified' AND deal == 'won' AND no active job today       -> openWonAccountPanel
prospect == 'qualified' AND deal in {none, deferred}                    -> launchEncounter
prospect == 'qualified' AND deal == 'lost'                              -> openLostDealPanel
otherwise                                                               -> openDialogue
```

Service-job handoff mirrors the encounter handoff: `startJob(jobId)` flips it to `in_progress`, register a one-shot listener, `scene.pause()` + `scene.launch('ServiceJobScene', ...)`. On result, `finishJob(...)` writes status/quality/payout and updates the account's totals; `scene.resume()`; toast.

Day-close handoff: `scene.pause()` + `scene.launch('DayCloseScene', { state, onAdvance })`; on done event, resume.

## Content validation

`validateContent(...)` (now M4) checks all of:

- duplicate NPC ids, missing dialogue ids, dangling option/resume targets (M2/M3)
- prospect seeds with no NPC placement, profiles deriving unknown archetypes (M3)
- service plans with non-positive cadence/payout/zones (M4)
- yard layouts missing their NPC, duplicate yards, empty zone lists, non-positive `secondsToService` (M4)

Failure throws `ContentValidationError` at the top of `DistrictScene.create()`.

## Where M5 plugs in

Account satisfaction will live as a per-account derived field (`totalCompleted` and `totalMissedOrFailed` are already on the record). M5 will add a sliding-window satisfaction calc and route it back into recurring value. The encounter system stays unchanged. The job system gets one optional new outcome (`'rushed'`?) but the existing scoring math already supports any quality fraction, so it's a content/balance change rather than a structural one. A second district means parameterising the world bound and tile data; no scene-flow change is needed.
