# Neighborhood Service-Business RPG

Vertical slice of a top-down 2D business RPG. A solo-operator exterior-services game: explore neighborhoods, identify prospects, qualify leads, close deals, perform the work, and grow a route while a rival property-management group pressures the same blocks.

**Current milestone: M3 — Closing Encounter.** Qualified leads now transition into a dedicated negotiation scene that resolves into a win, loss, or defer; wins open a minimal account record. Route Book UI, the first service-job loop, rivals, and save/load are still ahead.

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
| Leave dialogue / walk away   | `Esc`                 |

## What exists in M3

- Everything from M1 + M2 (district, movement, NPCs, branching dialogue, prospect ledger, status badges and toasts)
- Dedicated `ClosingEncounterScene` launched as a parallel scene over a paused `DistrictScene`
- Six readable encounter meters: Interest, Trust, Budget Flex, Urgency, Margin Pressure, Composure
- Five data-authored negotiation actions: Ask Need, Present Service, Anchor Price, Offer Reassurance, Close Now
- Four customer archetypes derived from each NPC's `QualificationProfile` — different starting meters, different reactions to the same actions
- Per-archetype objection lines fire when meters fall below thresholds and append to the customer's reaction
- Three encounter outcomes — win, lose, defer — with a result summary panel
- Wins open an `AccountRecord` with plan and monthly value; the price interpolates between archetype price floor and ceiling based on final Budget Flex
- Three separate state domains on `GameState`: prospects (M2), deals (M3), accounts (M3) — closing outcomes never overwrite qualification status
- Re-entry routing: qualified+open deal → encounter; qualified+won → account info; qualified+lost → closed-door panel; everything else → existing M2 dialogue
- Startup content validation: missing dialogue ids, dangling option targets, dangling resume nodes, missing prospects, and unknown archetypes throw at boot

## What's explicitly out of scope right now

- Route Book / scheduling / job calendar (M4)
- Service-job gameplay (M5)
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
    config.ts                              resolution / tile size constants (constants only, no imports)
  scenes/
    BootScene.ts                           hands off to PreloadScene
    PreloadScene.ts                        generates tileset + person textures at runtime
    DistrictScene.ts                       gameplay scene; owns GameState + DialogueController + handoff to encounter
    ClosingEncounterScene.ts               negotiation scene; renders meters, actions, result summary
  entities/
    Player.ts                              player sprite wrapper
    Npc.ts                                 NPC sprite wrapper + status badge
  state/
    GameState.ts                           in-memory store for prospects + deals + accounts (toJSON-ready)
    prospects.ts                           ProspectStatus / QualificationProfile
    deals.ts                               DealStatus / DealRecord
    accounts.ts                            AccountRecord / AccountPlan
  systems/
    input/PlayerController.ts              key bindings + velocity update
    interactions/
      InteractionPrompt.ts                 floating "[E] ..." bubble over nearest NPC
      InteractionPanel.ts                  bottom-screen dialogue widget + post-deal info renderer
      StatusToast.ts                       transient outcome confirmation
    dialogue/
      dialogueTypes.ts                     DialogueGraph / Node / Option / Effect / Condition
      DialogueController.ts                graph walk + effect application + resume rules
    closing/
      closingTypes.ts                      EncounterMeter / Action / Archetype / ViewModel / Result
      ClosingEncounterController.ts        meter update + outcome resolution (no Phaser deps)
    content/
      validateContent.ts                   startup validator; throws on missing/dangling references
  content/
    districts/starterDistrict.ts           district tile data
    npcs/starterDistrictNpcs.ts            NPC placements
    prospects/starterDistrictProspects.ts  per-NPC qualification profiles + lookup
    dialogue/starterDistrictDialogue.ts    authored conversations
    closing/
      customerArchetypes.ts                archetypes + profile->archetype derivation
      closingActions.ts                    action registry (deltas, mods, reactions)
      objectionSets.ts                     archetype-keyed objection triggers
  types/index.ts                           shared types (NpcData, SceneState, etc.)
docs/
  spec.md
  milestones.md
  architecture.md
```

## License

Unlicensed, internal prototype.
