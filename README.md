# Neighborhood Service-Business RPG

Vertical slice of a top-down 2D business RPG. A solo-operator exterior-services game: explore neighborhoods, identify prospects, qualify leads, close deals, perform the work, and grow a route while a rival property-management group pressures the same blocks.

**Current milestone: M1 — District exploration foundation.** No qualification, dialogue branching, jobs, Route Book, rival systems, or save/load yet.

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

## Controls (M1)

| Action   | Keys                  |
| -------- | --------------------- |
| Move     | `WASD` or Arrow keys  |
| Interact | `E` or `Space`        |
| Close    | `Esc` (also `E`/`Space`) |

## What exists in M1

- Phaser + TS + Vite skeleton tuned for pixel-perfect rendering at a 640x360 internal resolution (FIT-scaled)
- Boot -> Preload (runtime-generated tileset + person sprite) -> District scene flow
- A walkable starter district ("Sycamore Ridge") with grass, sidewalks, road, houses, fences, trees, driveways, flowers, and a tree border
- 4-direction keyboard movement with smooth diagonal normalization
- Arcade Physics collisions against solid tiles (walls, roofs, fences, trees) and against NPCs
- Camera follow with a world-size bound and round-pixel snapping
- 4 distinct NPCs with unique tints and placeholder lines
- Interact prompt that pops over the nearest NPC in range
- Bottom-screen interaction panel (name + role + placeholder line) that pauses movement until closed
- District layout and NPC placements live in `src/content/` so content changes do not require touching scene code

## What's explicitly out of scope for M1

- Branching dialogue, trust meters, and qualification logic
- Closing Encounter mini-game
- Route Book, scheduling, or service-job gameplay
- Rival (IronRoot) presence or events
- Save/load
- Audio
- Gamepad / touch input

See [`docs/milestones.md`](docs/milestones.md) for the full roadmap.

## Repo layout

```
src/
  main.ts                        bootstrap entry
  game/
    Game.ts                      Phaser.Game factory
    config.ts                    resolution / tile size constants (constants only, no imports)
  scenes/
    BootScene.ts                 minimal, hands off to PreloadScene
    PreloadScene.ts              generates tileset + person textures at runtime
    DistrictScene.ts             gameplay scene for a single district
  entities/
    Player.ts                    player sprite wrapper
    Npc.ts                       NPC sprite wrapper (data-driven)
  systems/
    input/PlayerController.ts    key binding + velocity update
    interactions/
      InteractionPrompt.ts       "[E] Talk" bubble over nearest NPC
      InteractionPanel.ts        bottom-screen dialogue panel stub
  content/
    districts/starterDistrict.ts district tile data (built programmatically)
    npcs/starterDistrictNpcs.ts  NPC placements for the starter district
  types/index.ts                 shared types
docs/
  spec.md
  milestones.md
  architecture.md
```

## License

Unlicensed, internal prototype.
