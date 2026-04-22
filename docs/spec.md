# Spec - Neighborhood Service-Business RPG

## Concept (locked)

Explore neighborhoods, identify prospects, qualify leads, enter dedicated Closing Encounters, win recurring accounts, perform the work, and grow a small exterior-services business while resisting a corporate rival (IronRoot Property Group).

## Pillars

1. **Readable districts.** Game Boy-class clarity: a glance tells you what's a yard, what's a walkable path, what's a house, where an NPC is. Pixel-perfect scaling.
2. **Deliberate movement.** Tile-grounded top-down exploration. Keyboard-first. No fiddly controls; you can tell when you're "about to" interact.
3. **Conversation-as-gameplay.** The "boss fight" is closing a deal. Later milestones build up qualification, trust, objections, and the Closing Encounter mini-game.
4. **Small loop, visible growth.** Small routes, steady recurring jobs, a rival applying pressure to the same blocks you work. Your Route Book is the progression track.

## Near-term scope boundary (through M2)

The district is visible and playable; NPCs can be qualified, deferred, or disqualified through authored branching dialogue. The actual *closing* of a deal, performing the work, and scheduling are still deferred to M3+.

The qualification step is the first half of the prospecting loop: pick the right block, read the right door, choose the right line. Trying to oversell or under-price reads as desperate and burns the door. M3's Closing Encounter then takes a `qualified` lead and turns it into a binding commitment via a dedicated mini-game.

## Prospect states (M2)

Each NPC carries a `ProspectStatus` in the in-memory game state:

- `unknown` — not yet read, or read inconclusively
- `qualified` — wants the service, agreed in principle, ready for a closing pass
- `deferred` — not now, but the door is still open; revisit later
- `disqualified` — door is closed (oversold, mispriced, talked over them, or genuinely not a customer)

A small coloured pip appears above an NPC's head once their status leaves `unknown`. Re-engaging an NPC reflects their stored status — they remember what was said.

## Controls (desktop keyboard)

- Move: `WASD` or arrow keys
- Interact / advance single-option: `E` or `Space`
- Choose dialogue option: `1` – `4`
- Cancel / leave conversation: `Esc`

Gamepad and touch are out of scope for now.

## Tech constraints

- Browser-first (no Electron, no native shell)
- Stack: Phaser 3 + TypeScript (strict) + Vite
- Pixel rendering: `pixelArt: true`, `roundPixels: true`, `antialias: false`, scale mode `FIT`
- Internal resolution: 640x360; tile size: 16px
- No giant manager classes; prefer small modules and data files
- Content lives in `src/content/` so scenes do not embed gameplay data
