# Architecture

This document describes only what exists today (M1). It updates as the game grows.

## Boot flow

```
index.html
  |-- <script type="module" src="/src/main.ts">
main.ts
  |-- createGame('app')                    // src/game/Game.ts
         |-- new Phaser.Game(config)       // config assembled in Game.ts
                |-- scenes: [BootScene, PreloadScene, DistrictScene]

src/game/config.ts is constants only (GAME_WIDTH, GAME_HEIGHT, TILE_SIZE).
Scenes are imported in Game.ts, never in config.ts, so that scene files can freely import TILE_SIZE without forming an import cycle.
```

`BootScene` is intentionally trivial — it exists as a seam so future "choose save slot" / "splash" work can slot in without restructuring. It immediately hands off to `PreloadScene`.

`PreloadScene` generates all runtime textures (tileset + person sprite) via `Phaser.GameObjects.Graphics.generateTexture`, then starts `DistrictScene`. Nothing is loaded from disk in M1; this keeps the repo self-contained while the game design is still moving.

`DistrictScene` is the single play scene. It knows about: tile content, the player, NPCs, the camera, the interaction UI, and its own `EXPLORING | DIALOGUE` state.

## Rendering

- Game config uses `pixelArt: true`, `roundPixels: true`, `antialias: false`.
- Internal resolution `640x360` (16:9) scaled via `Phaser.Scale.FIT`, centered.
- Tile size `16`. The starter district is `50 x 34` tiles (`800 x 544` world pixels), so the camera always has slack to pan.

## World data

The district is built programmatically (not loaded from a Tiled JSON) in `src/content/districts/starterDistrict.ts`. It exports a `DistrictData` record:

```ts
interface DistrictData {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: ReadonlyArray<ReadonlyArray<number>>;  // 2D, [row][col]
  spawn: TilePos;
}
```

Each cell value is a `TILE_INDEX` enum value. Solid tile indices are centralised in `SOLID_TILE_INDICES`. Phaser's tilemap layer handles rendering; collision is driven by `layer.setCollision([...SOLID_TILE_INDICES])`.

NPCs live in `src/content/npcs/starterDistrictNpcs.ts` as a `ReadonlyArray<NpcData>`. Each record carries its placement, display name, tint, role, and placeholder line. The scene does not hardcode NPC identities.

## Entities

- `Player` wraps a `Phaser.Physics.Arcade.Sprite` at the spawn tile, with a small body offset so the collision footprint sits at the feet.
- `Npc` wraps the same sprite texture, tinted per-NPC, with an immovable body so the player bumps into them cleanly.

## Systems

- `PlayerController` is a pure behaviour class: it reads the input keys and writes velocity onto the player body. Diagonal movement is normalised so you don't move faster sideways. It also returns a `Facing` so the scene can track player direction for future use (directional interaction, sprite rotation, animations).
- `InteractionPrompt` is a world-space container ("[E] Talk") that the scene positions over whichever NPC is nearest and within `INTERACT_RADIUS`.
- `InteractionPanel` is a `scrollFactor = 0` container pinned to the bottom of the screen. It shows the NPC's name, role, and placeholder line until dismissed.

## Scene state

`DistrictScene` holds a simple `SceneState = 'EXPLORING' | 'DIALOGUE'`. The state gates input: when in `DIALOGUE`, the controller is ticked in locked mode (velocity zero) and only `E`/`Space`/`Esc` are consulted. This avoids a more elaborate state-machine framework before we need one.

## What M2 will change, and what it won't

Adding qualification dialogue is expected to touch:

- `InteractionPanel` (grow into a dialogue widget with options) or a sibling `DialogueView`
- A new `src/content/dialogue/` tree
- A new prospect-ledger module (probably `src/systems/prospects/`)

It is **not** expected to touch:

- Scene wiring in `DistrictScene` beyond swapping the panel for a dialogue widget
- Player / Npc / PlayerController
- `starterDistrict.ts` tile data
- `PreloadScene` textures

That separation is the point of M1's structure.
