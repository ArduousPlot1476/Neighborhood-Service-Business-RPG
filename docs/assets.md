# Assets

The vertical slice has no asset files. Every visual is generated procedurally at runtime. This was a deliberate choice to keep the repo self-contained while design was moving and to avoid blocking on art direction.

## What's procedurally generated

`src/scenes/PreloadScene.ts` builds two textures with `Phaser.GameObjects.Graphics.generateTexture`:

- **`tiles`** — a 10-tile palette: grass, sidewalk, road, driveway, wall, roof, fence, tree, door, flower. Each tile is 16×16 with a hand-shaded palette. Solid tiles are listed in `SOLID_TILE_INDICES`.
- **`person`** — a 12×16 sprite for the player and all NPCs, tinted per-NPC.

Districts and yards use these two textures. Service-job zones are drawn as plain `Phaser.GameObjects.Rectangle`s with palette colours pulled from `src/content/jobs/starterJobs.ts` (`ZONE_BASE_COLOR` / `ZONE_DONE_COLOR`).

UI widgets (interaction prompt, dialogue panel, status toast, encounter HUD, Route Book overlay, Day Close panel) are composed from `Rectangle` + `Text` primitives — no images, no spritesheets.

## Audio

None. Every milestone has explicitly deferred audio. A small generated-cue pass (six events: encounter open, zone cleared, job done, day close, disruption triggered, save) is on the post-slice backlog.

## Fonts

The browser monospace stack only. No web fonts loaded.

## Replacing placeholders later

If we move to authored art, each insertion point is small:

| Replace                          | Where                              | Notes |
| -------------------------------- | ---------------------------------- | ----- |
| Tile palette                     | `PreloadScene.renderTileset`        | Swap `generateTexture` for `this.load.spritesheet(...)` and update `TILE_INDEX` if the order changes |
| Person sprite                    | `PreloadScene.renderPerson`         | Same — swap to `load.spritesheet`. Tinting in `Npc.ts` already works on a real sprite |
| Service-job zone art             | `ServiceJobScene.buildYard`         | Replace `Rectangle` zones with sprite frames; keep the rectangle hit-test for `zoneContains` |
| HUD chrome                       | Various scenes                      | `Rectangle` + `Text` everywhere; could move to nine-slice panels |
| Status icons (`!`, `RIVAL`)      | `Npc.ts`                            | Currently `Text`; can swap to image sprites with the same tween |

No part of game logic depends on a specific texture path or atlas — replacing assets is a render-layer change.
