# Neighborhood Service-Business RPG

Vertical slice of a top-down 2D business RPG. A solo-operator exterior-services game: explore neighborhoods, identify prospects, qualify leads, close deals, perform the work, and grow a route while a rival property-management group pressures the same blocks.

**Current milestone: M2 — Qualification dialogue.** Branching conversations, prospect ledger, and per-NPC qualification state are in place. Closing Encounter, Route Book, jobs, rivals, and save/load are still ahead.

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

Vite serves the game at `http://127.0.0.1:7777/` and attempts to open your browser automatically. The port is `strictPort`-locked, so if something else is holding it Vite will fail loudly instead of silently moving — that's intentional, so the URL always matches what the README says.

## Build it

```bash
npm run build      # tsc --noEmit + vite build -> dist/
npm run preview    # serves the production build
npm run typecheck  # tsc --noEmit only
```

## Controls

| Action                | Keys                  |
| --------------------- | --------------------- |
| Move                  | `WASD` or Arrow keys  |
| Talk / advance        | `E` or `Space`        |
| Choose dialogue option| `1` – `4`             |
| Leave conversation    | `Esc`                 |

## What exists in M2

- Everything from M1 (pixel-perfect 640×360 district, movement, collisions, camera, four placed NPCs)
- Authored branching dialogue per NPC, driven by a `DialogueGraph` (nodes, options, optional effects, conditional branches)
- In-memory prospect ledger: `unknown`, `qualified`, `deferred`, `disqualified`
- Per-NPC qualification profile (`serviceNeed`, `budgetSignal`, `objectionStyle`) — read by future systems, surfaced in dialogue tone today
- Status badge above each NPC reflects their current standing
- Status toast confirms outcomes when they land
- Re-talking to an NPC routes through `resumeRules` so they remember (qualified Jerry won't re-pitch you on Saturdays)
- Authored conversations include at least one path each to qualified, deferred, disqualified, and a dead-end non-prospect

## What's explicitly out of scope right now

- Closing Encounter mini-game (M3)
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
    Game.ts                                Phaser.Game factory
    config.ts                              resolution / tile size constants (constants only, no imports)
  scenes/
    BootScene.ts                           minimal, hands off to PreloadScene
    PreloadScene.ts                        generates tileset + person textures at runtime
    DistrictScene.ts                       gameplay scene; owns GameState + DialogueController
  entities/
    Player.ts                              player sprite wrapper
    Npc.ts                                 NPC sprite wrapper + status badge
  state/
    GameState.ts                           in-memory store + change events (toJSON-ready)
    prospects.ts                           ProspectStatus / QualificationProfile types + colours/labels
  systems/
    input/PlayerController.ts              key bindings (movement, interact, digits) + velocity update
    interactions/
      InteractionPrompt.ts                 floating "[E] Talk" bubble over nearest NPC
      InteractionPanel.ts                  bottom-screen dialogue widget (text + numbered options)
      StatusToast.ts                       transient outcome confirmation
    dialogue/
      dialogueTypes.ts                     DialogueGraph / Node / Option / Effect / Condition
      DialogueController.ts                graph walk + effect application + resume rules
  content/
    districts/starterDistrict.ts           district tile data (programmatic)
    npcs/starterDistrictNpcs.ts            NPC placements
    prospects/starterDistrictProspects.ts  per-NPC qualification profiles
    dialogue/starterDistrictDialogue.ts    authored conversations
  types/index.ts                           shared types
docs/
  spec.md
  milestones.md
  architecture.md
```

## License

Unlicensed, internal prototype.
