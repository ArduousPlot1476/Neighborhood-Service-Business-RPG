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

## M5 - Day cycle + service-job depth (next)

Goal: deepen the per-day loop. Job quality starts to feed back into account satisfaction; missed jobs dent recurring value; travel time and a per-day energy/composure budget create choices about which jobs to chase.

Planned:

- Account satisfaction tracked over recent service quality
- Missed/failed jobs cost recurring value over time
- A simple per-day energy/composure budget — service jobs cost it, encounters cost it, optional rest restores it
- Day Close summary calls out satisfaction shifts and warns about upcoming churn
- Possibly: a second district to give travel meaningful trade-offs

## M6 - IronRoot rival pressure

Goal: a visible antagonist who contests blocks you work.

## M7 - Save/load and session continuity
