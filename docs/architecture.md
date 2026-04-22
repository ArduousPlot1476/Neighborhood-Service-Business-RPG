# Architecture

This document describes only what exists today (M2). It updates as the game grows.

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

`PreloadScene` generates all runtime textures (tileset + person sprite) via `Phaser.GameObjects.Graphics.generateTexture`, then starts `DistrictScene`. Nothing is loaded from disk; this keeps the repo self-contained while the game design is still moving.

`DistrictScene` is the single play scene. It owns: tile content, player, NPCs, camera, the interaction prompt and panel, the status toast, the in-memory `GameState`, and the `DialogueController`. The scene state is still a simple `EXPLORING | DIALOGUE` gate.

## Rendering

- Game config uses `pixelArt: true`, `roundPixels: true`, `antialias: false`.
- Internal resolution `640x360` (16:9) scaled via `Phaser.Scale.FIT`, centered.
- Tile size `16`. The starter district is `50 x 34` tiles (`800 x 544` world pixels).

## World data

The district is built programmatically in `src/content/districts/starterDistrict.ts`, exporting a `DistrictData` record (id, name, width, height, tiles, spawn).

NPCs live in `src/content/npcs/starterDistrictNpcs.ts` as a `ReadonlyArray<NpcData>`. Each record carries placement, display name, tint, role, and a `dialogueId` that resolves to a `DialogueGraph` in `src/content/dialogue/`.

## Entities

- `Player` wraps a `Phaser.Physics.Arcade.Sprite` at the spawn tile, with a small body offset so the collision footprint sits at the feet.
- `Npc` wraps the same sprite texture, tinted per-NPC, with an immovable body. It also owns a small status badge above the head that the scene drives off the prospect ledger (`unknown` hides the badge; other states show a coloured pip).

## Prospect / game state (M2)

`src/state/GameState.ts` is a small in-memory store. It maps `npcId -> ProspectRecord { status, lastUpdatedTick, notes }` where `ProspectStatus = 'unknown' | 'disqualified' | 'deferred' | 'qualified'`. It exposes `registerProspect`, `getProspectStatus`, `setProspectStatus`, `listProspects`, an `on(listener)` hook, and `toJSON()` for forward compatibility with M7's save system.

`QualificationProfile` lives next to it (`src/state/prospects.ts`) and is seeded from `src/content/prospects/starterDistrictProspects.ts`. Profiles aren't read by gameplay yet — they exist so M3's Closing Encounter can branch on `objectionStyle` and `budgetSignal` without re-authoring anything.

The store deliberately holds no Phaser references, so it can be unit-tested headlessly and serialised wholesale later.

## Dialogue system (M2)

Three layers, kept decoupled:

1. **Content** — `src/content/dialogue/starterDistrictDialogue.ts` exports `DialogueGraph` records (`{ rootId, nodes, resumeRules? }`). A `DialogueOption` carries a label, an optional `next` node id, optional `effects[]`, and an optional `showIf` condition. Dialogue files import only types — never scenes, never Phaser.
2. **Logic** — `src/systems/dialogue/DialogueController.ts` walks the graph, applies effects to `GameState`, evaluates `resumeRules` against the prospect's current status to pick the entry node on re-visit, and emits a plain `DialogueViewModel` for the UI. It owns no Phaser objects either, so the same controller will drive the Closing Encounter UI in M3.
3. **View** — `src/systems/interactions/InteractionPanel.ts` is the bottom-of-screen widget. It only renders a `DialogueViewModel` and reports option count back; it does not advance state on its own.

`DistrictScene` is the only thing that knows about all three layers. It calls `controller.start(...)` on interact, feeds digit keypresses into `controller.selectOption(i)`, re-renders the panel from each new view-model, and closes everything on the controller's `onEnd` callback.

`StatusToast` (sibling of the panel) listens to `GameState` changes via `gameState.on(...)` and surfaces a brief top-of-screen confirmation when an outcome lands.

## Scene state

`DistrictScene` holds `SceneState = 'EXPLORING' | 'DIALOGUE'`. In `DIALOGUE`, the controller is ticked in locked mode (velocity zero), digit keys drive option selection, `E`/`Space` advance single-option nodes, and `Esc` cancels. The dialogue controller owns the conversation lifecycle; the scene only mediates input.

## Where M3 plugs in

The Closing Encounter is intended to be a separate Phaser scene (`ClosingEncounterScene`), launched from `DistrictScene` when the player engages an NPC whose `GameState` status is already `qualified`. It will read the same `QualificationProfile` to shape the trust meter and objection stack, and write back to the same `GameState` on completion. No part of the dialogue graph or `DialogueController` should need to change — the handoff happens at the scene boundary, before the controller is even started.
