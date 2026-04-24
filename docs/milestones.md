# Milestones

Each milestone is strictly scoped. Do not pull future work forward.

## M1 - District exploration foundation

**Status: complete.**

Delivered:

- Phaser + TS + Vite skeleton with pixel-perfect rendering
- Boot -> Preload -> District scene flow
- Runtime-generated tileset and person sprite (no asset hunting required)
- Starter district "Sycamore Ridge" (50x34 tiles) with houses, yards, fences, sidewalks, road, driveways, trees, flowers, tree border
- Player with 4-direction keyboard movement, diagonal normalization, Arcade Physics body
- Collisions vs. solid tiles (walls, roofs, fences, trees) and vs. NPCs
- Camera follow with world bounds and round-pixel snapping
- 4 NPC placeholders with distinct tints, placed via data file
- Proximity-based interaction prompt
- Bottom-screen interaction panel stub (name + role + placeholder line)
- Movement locks while panel is open

Explicitly *not* in M1: dialogue branching, qualification, trust, Closing Encounter, jobs, Route Book, rival systems, save/load, audio.

## M2 - Qualification dialogue

**Status: complete.**

Delivered:

- Data-driven dialogue graph (`DialogueNode` -> `DialogueOption[]` -> optional `DialogueEffect[]`)
- Per-NPC `QualificationProfile` (service need, budget signal, objection style) seeded in `src/content/prospects/`
- In-memory `GameState` with prospect ledger: `unknown | disqualified | deferred | qualified` and a change-event hook
- Authored four conversation flows in `src/content/dialogue/starterDistrictDialogue.ts`, with at least one path each to qualified, disqualified, deferred, and a neutral non-prospect
- `InteractionPanel` upgraded to a multi-line dialogue widget with numbered choices (1-4), status pill, and a coloured speaker badge above each NPC
- Status changes surface a transient toast at the top of the screen
- Re-entering an NPC after an outcome routes through `resumeRules` so they remember
- Prompt label above an NPC reflects current status ("[E] Talk" -> "[E] Qualified" / "Follow up later" / "Not a fit")

Explicitly *not* in M2: Closing Encounter scene, trust meter, objection stack, Route Book, scheduling, jobs, rivals, save/load.

## M3 - Closing Encounter

**Status: complete.**

Delivered:

- Dedicated `ClosingEncounterScene` launched from `DistrictScene` for any NPC whose prospect status is `qualified` and whose deal status is `none` or `deferred`
- Six readable encounter meters (Interest, Trust, Budget Flex, Urgency, Margin Pressure, Composure) with per-archetype starting values
- Five data-authored actions (Ask Need, Present Service, Anchor Price, Offer Reassurance, Close Now) with per-archetype meter modifiers and reaction lines
- Four customer archetypes derived from the existing `QualificationProfile`; objection lines fire when meters drop below per-archetype thresholds
- Three encounter outcomes (win / lose / defer) with a result summary panel before returning to district
- Three separate state domains on `GameState`: `prospects` (qualification, M2), `deals` (closing lifecycle, M3), `accounts` (won-deal records, M3)
- Won deals open a minimal `AccountRecord` (npc, plan, monthly value, opening notes)
- Re-entry routing: qualified + (none|deferred) -> encounter; qualified + won -> account info panel; qualified + lost -> closed-door panel; everything else -> existing M2 dialogue
- Startup content validation: missing dialogue ids, dangling option targets, dangling resume nodes, missing prospect-NPC pairs, and unknown archetypes all throw at boot

Explicitly *not* in M3: Route Book UI, scheduling, service-job loop, day close, rivals, save/load, audio.

## M4 - Route Book + first service-job loop

**Status: complete.**

Delivered:

- New `jobs` state domain on `GameState` (`JobRecord` with status, quality, payout, scheduled day, zone counters), separate from prospects/deals/accounts
- Lightweight day model: `currentDay` (starts at 1), `dayState`, `closeDay()` advancing the day and rolling new scheduled jobs based on each plan's cadence
- `RouteBookOverlay` (Tab to toggle): per-account plan, recurring value, total earned to date, last serviced day, today's job status; whole-route summary header (day, account count, total recurring, lifetime earned)
- Won deals now schedule a first job for the current day automatically; an `!` marker bobs above an NPC whose yard has a job ready
- Dedicated `ServiceJobScene`: 4-zone yard, 60-80s timer, hold-`E` to service while standing in a coloured zone, projected payout updates live as zones clear; result panel shows quality (unfinished/rough/solid/pristine), zones cleared, time used, and payout vs. base
- `DayCloseScene`: earnings today, completed/missed/failed counts, per-job breakdown, lifetime totals, and a teaser line for the next day; `closeDay()` advances day and schedules next jobs on cadence
- District banner shows current day; engagement router now handles "qualified + won + job-ready-today" → `ServiceJobScene` and "qualified + won + no active job" → account info panel
- Content validator extended to cover service plans (cadence/payout/zone counts) and yard layouts (existence per NPC, zones non-empty, positive service durations)

Explicitly *not* in M4: rivals, save/load, customer-satisfaction effects from missed/failed jobs, multi-day route planning, audio.

## M5 - Account health, cadence consequences, first IronRoot disruption

**Status: complete.**

Delivered:

- `AccountRecord` extended with `satisfaction` (0-100), `nextDueDay`, `jobsMissed`, `jobsFailed`, `churned`, `churnedDay`
- Risk bands derived from satisfaction: `healthy / watch / at_risk / threatened` with labels and colours
- Helper functions in `state/accounts.ts` for completion / missed / failed / contest-resolved / contest-drift satisfaction deltas, plus `clampSatisfaction` and `riskBandFromSatisfaction`
- **Cadence fix**: only `completed` jobs reset the recurring cadence (`nextDueDay = scheduledDay + cadenceDays`). `missed` and `failed` jobs set `nextDueDay = currentDay + 1` so the property is owed an immediate catch-up — no more "miss a visit, get 14 days off the clock"
- New `disruptions` state domain (`DisruptionRecord` with status, deadline, narrative) — fifth top-level domain on `GameState`
- Authored disruption event: **IronRoot Doorhanger** — triggers at day close on any non-churned account in the `watch / at_risk / threatened` band, applies an immediate satisfaction penalty, and gives the player 3 days to win the customer back
- Resolution: completing a service job at `solid` or `pristine` quality clears the disruption and bumps satisfaction. Each unaddressed day drifts satisfaction down further. If the deadline passes unresolved, the account churns
- `DisruptionController` (no Phaser) coordinates triggers at day close and resolution at job completion; reusable via `DisruptionEventDefinition` registry — adding more events is content-only
- Route Book now shows per-account satisfaction, risk band, next-due day, and `OVERDUE` / `CONTESTED` tags, plus a separate "LOST TO IRONROOT" section for churned accounts
- NPCs with active disruptions show a pulsing `RIVAL` marker above the head; engagement prompt becomes "[E] Win them back"
- Day Close presents the full digest: today's earnings, per-job result, IronRoot triggered/expired/drifted activity, tomorrow's scheduled load, and a contextual teaser line
- Content validator extended to cover disruption events (duplicate ids, non-positive deadlines, empty resolve-quality lists)

Explicitly *not* in M5: rival ambient AI / multiple disruption types, save/load, audio.

## M6 - Save/load + final hardening

**Status: complete.** This is the final milestone of the vertical slice.

Delivered:

- Versioned save schema (`SaveEnvelope { schemaVersion, appVersion, savedAt, payload }`) backed by `localStorage` under `nrpg:save:v1`
- `GameState.fromSerialized(payload)` static factory that rebuilds all five domain Maps, derives `jobIdCounter` / `disruptionIdCounter` from existing ids, and applies safe defaults for any missing fields
- `saveSystem.ts` with `writeSave` / `readSave` / `clearSave` / `hasSavedGame`, returning tagged outcomes (`ok / unsupported / corrupt / incompatible / missing / error`); corrupt or version-incompatible saves are auto-cleared
- Auto-save on Day Close completion + manual save (`S`) from the Route Book + reset (`Shift+R`) from the Route Book + load-on-start in `DistrictScene.create()`
- Save status surfaces through the existing `StatusToast` (`Save loaded`, `Game saved`, `Auto-saved`, `Save unreadable — starting fresh`, etc.)
- Visual state rehydrates correctly after load: prospect badges, job-ready `!` markers, `RIVAL` markers, churned panel routing, day banner
- Won-account info panel is now contest-aware — when a disruption is active on the account, the panel shows the IronRoot narrative + days remaining alongside the standard health/cadence/today line
- `ACCOUNT_INITIAL_SATISFACTION` raised to 78 (healthy band) and the content validator now asserts that fresh accounts can't auto-trigger a doorhanger at the next day close
- Route Book footer shows live save hints (`[S] save`, `[Shift+R] clear save` only when a save exists); empty-state hint is now a four-step new-player onboarding script with NPC location callouts
- New docs: `docs/bugs.md`, `docs/playtest-notes.md`, `docs/assets.md`, plus a vertical-slice gate review in `docs/milestones.md`

Explicitly *not* in M6: audio (deferred), second authored disruption event (deferred — registry already proven structurally), arbitrary save slots, in-game settings.

## Vertical slice — gate review (M6)

| Pillar                        | Pass | Notes |
| ----------------------------- | ---- | ----- |
| Exploration feel              | Pass | 4-direction movement, collision against terrain + NPCs, prompt-on-proximity. Pixel-perfect render is intentional and reads cleanly at 640×360. |
| Qualification clarity         | Pass | Authored four-NPC dialogue tree with at least one path each to qualified / deferred / disqualified / non-prospect. Resume rules make NPCs remember what was said. |
| Closing Encounter readability | Pass | Six labelled meters, five named actions with descriptions, per-archetype reactions, threshold objections. Outcomes are predictable from the meter values, and the result panel confirms what just happened. |
| Account-win payoff            | Pass | Win toast + immediate scheduled job + `!` marker over the customer + Route Book entry with plan and recurring value. The transition from "you got a yes" to "you have work" is one beat. |
| Service job payoff            | Pass | Hold-`E` to service four zones under a 60-80s timer; projected payout updates live; result panel grades quality (unfinished/rough/solid/pristine) and pays accordingly. Account totals tick up. |
| Day Close clarity             | Pass | Earnings, per-job result, IronRoot activity, and tomorrow's schedule all render in one panel. Teaser line varies by what happened. |
| Account health + rival        | Pass | Satisfaction band is visible in Route Book and on the in-world panel. Doorhanger triggers at the right moment, daily drift is visible, expiration churns the account. |
| Save/load reliability         | Pass | Round-trip restores all five domains + day clock + visual markers. Corrupt/incompatible saves are safely discarded. |
| Architecture scalability      | Pass | Five explicitly-bounded state domains; pure-logic controllers (no Phaser deps) for dialogue / closing / service / disruption; content/logic/view split holds across all four authoring systems. Adding a second disruption event, second district, or second customer archetype is content-only.

## Backlog beyond the slice

- Audio pass (encounter open, zone cleared, day close, disruption triggered)
- A second authored disruption event (e.g. "HOA complaint" on consecutive misses)
- Route Book scrolling/pagination once 5+ accounts coexist
- Multi-district travel + a per-day energy budget
- Re-qualification flow for churned accounts
- Multiple save slots
