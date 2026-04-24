# Neighborhood Service-Business RPG

Vertical slice of a top-down 2D business RPG. A solo-operator exterior-services game: explore neighborhoods, identify prospects, qualify leads, close deals, perform the work, and grow a route while a rival property-management group pressures the same blocks.

**Current milestone: M5 — Account health, cadence consequences, first IronRoot disruption.** Service quality and missed work now materially matter. IronRoot can contest at-risk accounts; ignoring the contest churns the customer. Save/load is the remaining milestone before the slice locks down.

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

## What exists in M5

- Everything from M1–M4 (district + dialogue + qualification + Closing Encounter + accounts + jobs + Route Book + Day Close)
- **Account health.** `satisfaction` (0-100) per account, with named delta constants for completed (per quality), missed, failed, contest-resolved, and contest-drift. Risk bands `healthy / watch / at_risk / threatened` derive from satisfaction.
- **Cadence fix.** Only `completed` jobs reset the recurring service interval. `missed` and `failed` jobs push the catch-up to *tomorrow* — no more skipping a visit and getting two weeks back on the clock.
- **Fifth state domain.** `disruptions` (`active / resolved / expired`) lives next to prospects/deals/accounts/jobs on `GameState`. Total of five domains, all serialised independently in `toJSON()`.
- **First IronRoot disruption: the doorhanger.** Triggers at day close on any non-churned account in `watch` or worse, applies a satisfaction penalty, and gives 3 days to resolve. Resolution: complete the contested account's next job at `solid` or `pristine` quality.
- **Churn.** Disruptions that hit their deadline expire, and the affected account churns: still listed in the Route Book under "Lost to IronRoot" but no further jobs schedule.
- **`DisruptionController`.** Pure (no Phaser) coordinator with `evaluateOnDayClose(...)` and `evaluateOnJobCompletion(...)`. Events are authored via a `DisruptionEventDefinition` registry — adding new disruption types is content-only.
- **UI surfaces.** Route Book shows per-account health, risk band, next-due day, `OVERDUE` / `CONTESTED` tags, and a separate "LOST TO IRONROOT" section. NPCs show a pulsing `RIVAL` marker while contested. Day Close presents a full digest of today's earnings, per-job results, IronRoot triggered/expired/drifted activity, and a contextual teaser.
- **Validator extended** to cover disruption events.

## What's explicitly out of scope right now

- Save/load (`localStorage`) — M6
- Multiple disruption types or rival ambient AI — M6 stretch
- Audio
- Gamepad / touch input
- Multi-district travel

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
    DistrictScene.ts                       hub: GameState owner, controllers, scene handoff
    ClosingEncounterScene.ts               negotiation scene
    ServiceJobScene.ts                     yard service mini-loop
    DayCloseScene.ts                       end-of-day summary (closes day on enter, then renders digest)
  entities/
    Player.ts                              player sprite wrapper
    Npc.ts                                 NPC sprite + status badge + job-ready marker + RIVAL marker
  state/
    GameState.ts                           in-memory store: prospects + deals + accounts + jobs + disruptions + day
    prospects.ts                           ProspectStatus / QualificationProfile
    deals.ts                               DealStatus / DealRecord
    accounts.ts                            AccountRecord (satisfaction, nextDueDay, churned) + helpers
    jobs.ts                                JobRecord / JobStatus / JobQuality
    disruptions.ts                         DisruptionRecord / DisruptionStatus
  systems/
    input/PlayerController.ts              key bindings + velocity update
    interactions/
      InteractionPrompt.ts                 floating "[E] ..." bubble over nearest NPC
      InteractionPanel.ts                  bottom-screen dialogue widget + post-deal info
      StatusToast.ts                       transient outcome confirmation
    dialogue/
      dialogueTypes.ts
      DialogueController.ts                graph walk + effect application + resume rules
    closing/
      closingTypes.ts
      ClosingEncounterController.ts        meter update + outcome resolution
    service/
      serviceJobTypes.ts
      ServiceJobController.ts              zone progress + timer + scoring
    rival/
      disruptionTypes.ts                   DisruptionEventDefinition + ctxs + day-close digest
      DisruptionController.ts              event triggers + resolution + churn
    content/
      validateContent.ts                   startup validator
  ui/
    RouteBookOverlay.ts                    in-scene overlay (health, risk band, contested/overdue tags, churned section)
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
    jobs/starterJobs.ts                    per-NPC yard layouts
    events/disruptionEvents.ts             authored disruption registry (M5)
  types/index.ts
docs/
  spec.md
  milestones.md
  architecture.md
```

## License

Unlicensed, internal prototype.
