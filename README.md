# Neighborhood Service-Business RPG

Vertical slice of a top-down 2D business RPG. A solo-operator exterior-services game: explore neighborhoods, identify prospects, qualify leads, close deals, perform the work, and grow a route while a rival property-management group pressures the same blocks.

**Current milestone: M6 — Save/load + final hardening.** The vertical slice is feature-complete and demo-ready. Sessions persist via `localStorage` with versioned saves, auto-save on Day Close, and explicit save/load/reset controls in the Route Book. Post-slice items are tracked in [`docs/milestones.md`](docs/milestones.md).

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

Vite serves the game at `http://127.0.0.1:7777/`. The port is `strictPort`-locked.

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
| Manual save (in Route Book)  | `S`                   |
| Clear save (in Route Book)   | `Shift + R`           |
| Leave dialogue / walk away   | `Esc`                 |

## What exists in M6

- Everything from M1–M5 (district + dialogue + qualification + Closing Encounter + accounts + jobs + Route Book + Day Close + account health + IronRoot disruption + churn)
- **Versioned save schema** (`SaveEnvelope { schemaVersion, appVersion, savedAt, payload }`) on `localStorage` key `nrpg:save:v1`
- **`GameState.fromSerialized(payload)`** factory — rebuilds all five domain Maps, derives id counters, applies safe defaults
- **Auto-save on Day Close**, **manual save (`S`)** from the Route Book, **reset (`Shift+R`)** from the Route Book, **load on start** in `DistrictScene.create()`
- **Visual restoration**: prospect badges, job-ready `!`, `RIVAL` markers, churned account routing, day banner all reflect the loaded state
- **Contest-aware account info panel** — when an account is contested, the won-account info panel shows the IronRoot narrative + days remaining
- **Validator assertion** that `ACCOUNT_INITIAL_SATISFACTION` (now 78) puts new accounts in the `healthy` band so brand-new accounts can't auto-trigger a doorhanger
- **Route Book** footer shows live save hints; empty-state hint is a four-step new-player onboarding script with NPC location callouts
- New docs: [`docs/bugs.md`](docs/bugs.md), [`docs/playtest-notes.md`](docs/playtest-notes.md), [`docs/assets.md`](docs/assets.md), plus a vertical-slice gate review in [`docs/milestones.md`](docs/milestones.md)

## What is not in the slice

- Audio
- Multiple save slots
- A second authored disruption event (registry already supports it; ship one in post-slice content work)
- Multi-district travel, per-day energy budget, re-qualification of churned accounts
- Gamepad / touch input

See [`docs/milestones.md`](docs/milestones.md) for the post-slice backlog and [`docs/architecture.md`](docs/architecture.md) for the system layout.

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
    DistrictScene.ts                       hub: GameState owner, controllers, scene handoff, save/load
    ClosingEncounterScene.ts               negotiation scene
    ServiceJobScene.ts                     yard service mini-loop
    DayCloseScene.ts                       end-of-day summary
  entities/
    Player.ts                              player sprite wrapper
    Npc.ts                                 NPC sprite + status badge + job-ready marker + RIVAL marker
  state/
    GameState.ts                           five-domain in-memory store (+ fromSerialized factory)
    prospects.ts                           ProspectStatus / QualificationProfile
    deals.ts                               DealStatus / DealRecord
    accounts.ts                            AccountRecord (satisfaction, nextDueDay, churned) + helpers
    jobs.ts                                JobRecord / JobStatus / JobQuality
    disruptions.ts                         DisruptionRecord / DisruptionStatus
    saveSchema.ts                          versioned save envelope
    saveSystem.ts                          localStorage write / read / clear
  systems/
    input/PlayerController.ts              key bindings + velocity update
    interactions/
      InteractionPrompt.ts                 floating "[E] ..." bubble over nearest NPC
      InteractionPanel.ts                  bottom-screen dialogue widget + post-deal info
      StatusToast.ts                       transient outcome confirmation
    dialogue/
      dialogueTypes.ts
      DialogueController.ts
    closing/
      closingTypes.ts
      ClosingEncounterController.ts
    service/
      serviceJobTypes.ts
      ServiceJobController.ts
    rival/
      disruptionTypes.ts
      DisruptionController.ts
    content/
      validateContent.ts
  ui/
    RouteBookOverlay.ts                    in-scene overlay (health, risk, contested/overdue/churned, save hints)
  content/
    districts/starterDistrict.ts
    npcs/starterDistrictNpcs.ts
    prospects/starterDistrictProspects.ts
    dialogue/starterDistrictDialogue.ts
    closing/
      customerArchetypes.ts
      closingActions.ts
      objectionSets.ts
    services/servicePlans.ts
    jobs/starterJobs.ts
    events/disruptionEvents.ts
  types/index.ts
docs/
  spec.md
  milestones.md
  architecture.md
  bugs.md
  playtest-notes.md
  assets.md
```

## License

Unlicensed, internal prototype.
