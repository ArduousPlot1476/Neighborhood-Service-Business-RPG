# Neighborhood Service-Business RPG

Vertical slice of a top-down 2D business RPG. A solo-operator exterior-services game: explore neighborhoods, identify prospects, qualify leads, close deals, perform the work, and grow a route while a rival property-management group pressures the same blocks.

**Current milestone: M4 — Route Book + first service-job loop.** Won accounts now produce scheduled jobs you actually do, on a real timer, in a dedicated scene. The Route Book shows the route as it grows; Day Close summarises earnings and rolls the calendar forward. Customer satisfaction effects, rivals, and save/load are still ahead.

## Stack

- [Phaser 3.80](https://phaser.io/) — game engine
- TypeScript (strict)
- [Vite](https://vitejs.dev/) — dev server and bundler

Browser-first, desktop-keyboard-first.

## Requirements

- Node.js 18+ (Node 20 LTS recommended)

## Run it

```bash
npm install
npm run dev
```

Vite serves the game at `http://127.0.0.1:7777/`. The port is `strictPort`-locked, so if something else is holding it Vite will fail loudly instead of silently moving — that's intentional, so the URL always matches what the README says.

## Build it

```bash
npm run build      # tsc --noEmit + vite build -> dist/
npm run preview    # serves the production build
npm run typecheck  # tsc --noEmit only
```

## Controls

| Action                       | Keys                  |
| ---------------------------- | --------------------- |
| Move                         | `WASD` or Arrow keys  |
| Talk / advance               | `E` or `Space`        |
| Choose dialogue option       | `1` – `4`             |
| Choose encounter action      | `1` – `5`             |
| Hold to service a yard zone  | `E` (in a coloured zone) |
| Route Book overlay           | `Tab`                 |
| End day (Day Close)          | `N`                   |
| Leave dialogue / walk away   | `Esc`                 |

## What exists in M4

- Everything from M1–M3 (district + dialogue + qualification ledger + Closing Encounter + accounts)
- New `jobs` state domain on `GameState` with `JobRecord { status, quality, payout, scheduledDay, ... }`
- Lightweight day model: `currentDay` (starts at 1), `closeDay()` advances day and rolls cadence-due jobs
- Route Book overlay (Tab): per-account plan, monthly value, lifetime earned, last serviced day, today's job status; route-wide summary
- Won deals auto-schedule a first service job for the current day; an `!` marker bobs above NPCs whose yard is ready
- Dedicated `ServiceJobScene`: 4-zone yard, hold-`E` to service, projected payout updates live, result panel scores quality (unfinished / rough / solid / pristine) and pays accordingly
- `DayCloseScene`: earnings today, completed/missed/failed counts, per-job breakdown, lifetime totals, teaser line for tomorrow
- District banner shows current day; engagement router now distinguishes "qualified-with-job-ready" from "qualified-no-job-today"
- Content validator extended to cover service plans (cadence/payout/zones) and yard layouts (per-NPC, non-empty zones, positive durations)

## What's explicitly out of scope right now

- Customer satisfaction / churn from missed/failed jobs (M5)
- Per-day energy/composure budget (M5)
- Multi-district travel (M5)
- Rival (IronRoot) presence and pressure (M6)
- Save/load and session continuity (M7)
- Audio
- Gamepad / touch input

See [`docs/milestones.md`](docs/milestones.md) for the full roadmap and [`docs/architecture.md`](docs/architecture.md) for how the layers fit together.

## Repo layout

```
src/
  main.ts                                  bootstrap entry
  game/
    Game.ts                                Phaser.Game factory (registers all scenes)
    config.ts                              resolution / tile size constants (constants only)
  scenes/
    BootScene.ts                           hands off to PreloadScene
    PreloadScene.ts                        generates tileset + person textures at runtime
    DistrictScene.ts                       hub: GameState owner, dialogue, route book, scene handoff
    ClosingEncounterScene.ts               negotiation scene
    ServiceJobScene.ts                     yard service mini-loop
    DayCloseScene.ts                       end-of-day summary
  entities/
    Player.ts                              player sprite wrapper
    Npc.ts                                 NPC sprite + status badge + job-ready marker
  state/
    GameState.ts                           in-memory store: prospects + deals + accounts + jobs + day
    prospects.ts                           ProspectStatus / QualificationProfile
    deals.ts                               DealStatus / DealRecord
    accounts.ts                            AccountRecord / AccountPlan / formatters
    jobs.ts                                JobRecord / JobStatus / JobQuality
  systems/
    input/PlayerController.ts              key bindings + velocity update
    interactions/
      InteractionPrompt.ts                 floating "[E] ..." bubble over nearest NPC
      InteractionPanel.ts                  bottom-screen dialogue widget + post-deal info
      StatusToast.ts                       transient outcome confirmation
    dialogue/
      dialogueTypes.ts                     DialogueGraph / Node / Option / Effect / Condition
      DialogueController.ts                graph walk + effect application + resume rules
    closing/
      closingTypes.ts                      EncounterMeter / Action / Archetype / ViewModel / Result
      ClosingEncounterController.ts        meter update + outcome resolution
    service/
      serviceJobTypes.ts                   ServiceJobInit / ViewModel / Result
      ServiceJobController.ts              zone progress + timer + scoring
    content/
      validateContent.ts                   startup validator
  ui/
    RouteBookOverlay.ts                    in-scene overlay over DistrictScene
  content/
    districts/starterDistrict.ts           district tile data
    npcs/starterDistrictNpcs.ts            NPC placements
    prospects/starterDistrictProspects.ts  per-NPC qualification profiles + lookup
    dialogue/starterDistrictDialogue.ts    authored conversations
    closing/
      customerArchetypes.ts                archetypes + profile->archetype derivation
      closingActions.ts                    action registry
      objectionSets.ts                     archetype-keyed objection triggers
    services/servicePlans.ts               plan registry (cadence, payout, zone count)
    jobs/starterJobs.ts                    per-NPC yard layouts (zones + timer)
  types/index.ts                           shared types (NpcData, SceneState, etc.)
docs/
  spec.md
  milestones.md
  architecture.md
```

## License

Unlicensed, internal prototype.
