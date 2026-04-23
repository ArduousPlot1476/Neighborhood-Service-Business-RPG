# Spec - Neighborhood Service-Business RPG

## Concept (locked)

Explore neighborhoods, identify prospects, qualify leads, enter dedicated Closing Encounters, win recurring accounts, perform the work, and grow a small exterior-services business while resisting a corporate rival (IronRoot Property Group).

## Pillars

1. **Readable districts.** Game Boy-class clarity: a glance tells you what's a yard, what's a walkable path, what's a house, where an NPC is. Pixel-perfect scaling.
2. **Deliberate movement.** Tile-grounded top-down exploration. Keyboard-first. No fiddly controls; you can tell when you're "about to" interact.
3. **Conversation-as-gameplay.** The "boss fight" is closing a deal. Later milestones build up qualification, trust, objections, and the Closing Encounter mini-game.
4. **Small loop, visible growth.** Small routes, steady recurring jobs, a rival applying pressure to the same blocks you work. Your Route Book is the progression track.

## Near-term scope boundary (through M3)

The district is visible and playable. NPCs can be qualified, deferred, or disqualified through authored branching dialogue. A `qualified` lead can be closed through a dedicated Closing Encounter scene that produces a win, a loss, or a defer — and a win opens a minimal recurring account. Performing the work and surfacing accounts in a Route Book are still deferred to M4+.

The full prospecting-to-account arc now plays end-to-end on at least one NPC: walk up, qualify through dialogue, re-engage, enter the Closing Encounter, choose negotiation actions, see an outcome, and (on a win) leave with an account on the books.

## State domains

Three separate state stores, one per concern. They are deliberately not collapsed.

**Prospect / qualification (M2)** — was the door worth knocking on?
- `unknown` — not yet read, or read inconclusively
- `qualified` — wants the service, agreed in principle, ready for a closing pass
- `deferred` — not now, but the door is open; revisit later
- `disqualified` — door is closed at the qualification layer (oversold, mispriced, or not a customer)

**Deal / closing (M3)** — did the negotiation turn into a commitment?
- `none` — never attempted
- `in_progress` — currently inside a Closing Encounter
- `won` — the encounter ended in a deal; an account record exists
- `lost` — the encounter ended without a deal; door is closed at the deal layer
- `deferred` — the encounter ended inconclusively; the player can re-pitch

**Account (M3)** — minimal record of a won deal: plan, monthly value, opening notes. Persists for the rest of the session and will surface in M4's Route Book.

Closing outcomes never overwrite qualification status. A `qualified` prospect whose deal is `lost` stays `qualified` in the prospect ledger — the door is closed at the deal layer, not the qualification layer. This separation matters because M4+ may let a re-pitch unlock with new tools, content, or rivalrous pressure without touching the qualification record.

A small coloured pip above an NPC reflects their qualification status once it leaves `unknown`. The interaction prompt label changes after qualification (e.g. "[E] Pitch" while a deal is open, "[E] Booked" after a win).

## Closing Encounter (M3)

A separate scene, not a panel. Triggered when the player engages an NPC whose qualification is `qualified` and whose deal is `none` or `deferred`.

Six meters drive the encounter. They start at archetype-specific values, are bounded `0-100`, and resolve the outcome on close:

- **Interest** — does the customer want the service?
- **Trust** — do they believe you specifically can deliver?
- **Budget Flex** — will they pay near the asking price?
- **Urgency** — is now the time to commit?
- **Margin Pressure** — how much you've ceded; affects the win price
- **Composure** — your turn budget; runs out and the encounter resolves on whatever's on the table

Five actions: **Ask Need**, **Present Service**, **Anchor Price**, **Offer Reassurance**, **Close Now**. Each spends composure and shifts meters; effects are modulated by the customer's archetype. Pushing the wrong lever (anchoring price too early on a `careful_decider`, soft-talking a `pragmatic_holdout`) burns trust.

Outcomes:
- **win** — `trust ≥ 60 && interest ≥ 65 && budgetFlex ≥ 50`. An account is opened with a price interpolated by final budget flex.
- **lose** — `trust ≤ 25 || interest ≤ 25`.
- **defer** — anything else, including walking away with `Esc`.

## Controls (desktop keyboard)

- Move: `WASD` or arrow keys
- Interact / advance single-option: `E` or `Space`
- Choose dialogue / encounter option: `1` – `5`
- Cancel dialogue / walk away from encounter: `Esc`

Gamepad and touch are out of scope for now.

## Tech constraints

- Browser-first (no Electron, no native shell)
- Stack: Phaser 3 + TypeScript (strict) + Vite
- Pixel rendering: `pixelArt: true`, `roundPixels: true`, `antialias: false`, scale mode `FIT`
- Internal resolution: 640x360; tile size: 16px
- No giant manager classes; prefer small modules and data files
- Content lives in `src/content/` so scenes do not embed gameplay data
