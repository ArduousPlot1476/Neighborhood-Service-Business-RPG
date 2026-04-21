# Spec - Neighborhood Service-Business RPG

## Concept (locked)

Explore neighborhoods, identify prospects, qualify leads, enter dedicated Closing Encounters, win recurring accounts, perform the work, and grow a small exterior-services business while resisting a corporate rival (IronRoot Property Group).

## Pillars

1. **Readable districts.** Game Boy-class clarity: a glance tells you what's a yard, what's a walkable path, what's a house, where an NPC is. Pixel-perfect scaling.
2. **Deliberate movement.** Tile-grounded top-down exploration. Keyboard-first. No fiddly controls; you can tell when you're "about to" interact.
3. **Conversation-as-gameplay.** The "boss fight" is closing a deal. Later milestones build up qualification, trust, objections, and the Closing Encounter mini-game.
4. **Small loop, visible growth.** Small routes, steady recurring jobs, a rival applying pressure to the same blocks you work. Your Route Book is the progression track.

## Near-term scope boundary (M1 only)

Everything about the district is visible and playable; everything about *selling, working, or scheduling* is deferred. The only thing an NPC does today is display a placeholder line.

## Controls (desktop keyboard)

- Move: `WASD` or arrow keys
- Interact / advance: `E` or `Space`
- Cancel / close: `Esc`

Gamepad and touch are out of scope for now.

## Tech constraints

- Browser-first (no Electron, no native shell)
- Stack: Phaser 3 + TypeScript (strict) + Vite
- Pixel rendering: `pixelArt: true`, `roundPixels: true`, `antialias: false`, scale mode `FIT`
- Internal resolution: 640x360; tile size: 16px
- No giant manager classes; prefer small modules and data files
- Content lives in `src/content/` so scenes do not embed gameplay data
