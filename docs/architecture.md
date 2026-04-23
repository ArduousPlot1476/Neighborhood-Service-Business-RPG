# Architecture

This document describes only what exists today (M3). It updates as the game grows.

## Boot flow

```
index.html
  |-- <script type="module" src="/src/main.ts">
main.ts
  |-- createGame('app')                    // src/game/Game.ts
         |-- new Phaser.Game(config)       // config assembled in Game.ts
                |-- scenes: [BootScene, PreloadScene, DistrictScene, ClosingEncounterScene]

src/game/config.ts is constants only (GAME_WIDTH, GAME_HEIGHT, TILE_SIZE).
Scenes are imported in Game.ts, never in config.ts, so that scene files can freely import TILE_SIZE without forming an import cycle.
```

`BootScene` is intentionally trivial — a seam for future "choose save slot" / splash work. It immediately hands off to `PreloadScene`.

`PreloadScene` generates all runtime textures (tileset + person sprite) at runtime. Nothing is loaded from disk; the repo stays self-contained while design is moving.

`DistrictScene` is the play scene. It owns: tile content, player, NPCs, camera, prompt + dialogue panel + status toast, the in-memory `GameState`, and the `DialogueController`. On boot it runs `validateContent(...)` against authored content and throws if anything is missing or dangling.

`ClosingEncounterScene` is the encounter scene. It is launched in parallel by `DistrictScene` (via `scene.launch` while `DistrictScene` is paused) for any qualified prospect with no won/lost deal yet. When the encounter resolves, it emits `closing:result` and stops itself; `DistrictScene` resumes.

## Rendering

- `pixelArt: true`, `roundPixels: true`, `antialias: false`.
- Internal resolution `640x360` (16:9), `Phaser.Scale.FIT`, centered.
- Tile size `16`. Starter district is `50 x 34` tiles (`800 x 544` world pixels).

## World data

Built programmatically in `src/content/districts/starterDistrict.ts`, exporting a `DistrictData` record. NPCs live in `src/content/npcs/starterDistrictNpcs.ts` and carry placement, name, tint, role, and a `dialogueId`. Profiles live alongside in `src/content/prospects/starterDistrictProspects.ts` and are looked up via `getProspectProfile(npcId)`.

## State domains (M3)

`src/state/GameState.ts` is the single in-memory store. Three explicitly separate domains, each with its own record type, listener event, and serialised shape:

| Domain         | File                  | Statuses                                            | What writes it                       |
| -------------- | --------------------- | --------------------------------------------------- | ------------------------------------ |
| Qualification  | `state/prospects.ts`  | `unknown / qualified / deferred / disqualified`     | Dialogue effects (M2)                |
| Closing/deal   | `state/deals.ts`      | `none / in_progress / won / lost / deferred`        | `ClosingEncounterScene` result (M3)  |
| Accounts       | `state/accounts.ts`   | `AccountRecord` per won deal                        | `gameState.openAccount(...)` on win  |

Closing outcomes never overwrite prospect status. A `qualified` prospect whose deal is `lost` stays `qualified` — the lost deal is its own piece of state, the door is closed at the deal layer not the qualification layer. The `DistrictScene` re-entry router is the only place that combines them to decide what UI to show.

`GameState` exposes `toJSON()` returning `{ tick, prospects, deals, accounts }` — ready for M7's save/load to `JSON.stringify` the whole store.

## Dialogue system (M2 — unchanged)

Three layers: **content** (`src/content/dialogue/`), **logic** (`src/systems/dialogue/DialogueController.ts`), **view** (`src/systems/interactions/InteractionPanel.ts`). Effects (`setStatus`, `end`) write to `GameState.prospects` only. M3 added a new `renderInfo(...)` method on the panel for short, choice-less post-deal panels (won/lost), reusing the same widget without going through the dialogue runner.

## Closing system (M3)

Four pieces, kept decoupled the same way as the dialogue system:

1. **Types** — `src/systems/closing/closingTypes.ts` exports `EncounterMeter`, `EncounterMeters`, `EncounterAction`, `MeterDelta`, `CustomerArchetype`, `ObjectionSet`, `EncounterInit`, `EncounterViewModel`, `EncounterResult`, `EncounterOutcome`. No Phaser imports.
2. **Content** —
   - `src/content/closing/customerArchetypes.ts` — four archetypes (`eager_believer`, `careful_decider`, `pragmatic_holdout`, `skeptical_haggler`) with starting meters, plan, base/floor price, and outcome lines. `deriveArchetypeId(profile)` maps a `QualificationProfile` to an archetype id.
   - `src/content/closing/closingActions.ts` — five actions (`ask_need`, `present_service`, `anchor_price`, `offer_reassurance`, `close_now`). Each carries a base meter delta, optional per-archetype mods, per-archetype reaction lines, and a composure cost. `close_now` is `terminal`.
   - `src/content/closing/objectionSets.ts` — per-archetype lines that fire when a meter drops below a threshold. Selected by the controller after each action and appended to the reaction line.
3. **Logic** — `src/systems/closing/ClosingEncounterController.ts` walks the encounter (no Phaser). Tracks the six meters, applies action deltas + archetype mods, checks objection triggers, advances turn, and resolves the outcome on `close_now`, on composure ≤ 0, or on `walkAway()`.
4. **View** — `src/scenes/ClosingEncounterScene.ts` hosts the UI: header, six meter bars, reaction line, action list with descriptions, and a result overlay.

Outcome thresholds (live in the controller):

- **win** — `trust >= 60 && interest >= 65 && budgetFlex >= 50`
- **lose** — `trust <= 25 || interest <= 25`
- **defer** — anything else (also: `walkAway()` always defers)

Win price is interpolated between archetype `priceFloorCents` and `basePriceCents` based on final budget flex.

## Scene state and handoff

`SceneState = 'EXPLORING' | 'DIALOGUE' | 'INFO_PANEL' | 'ENCOUNTER'`.

The `DistrictScene.engage(npc)` router decides what happens on interact:

```
prospect == 'qualified' AND deal in {none, deferred} -> launchEncounter   (ENCOUNTER)
prospect == 'qualified' AND deal == 'won'            -> openWonAccountPanel   (INFO_PANEL)
prospect == 'qualified' AND deal == 'lost'           -> openLostDealPanel     (INFO_PANEL)
otherwise                                            -> openDialogue          (DIALOGUE)
```

Encounter handoff:

1. `setDealStatus(npcId, 'in_progress')` and `recordEncounterAttempt(npcId)` so the deal record exists and the attempt counter advances even if the player walks away.
2. `scene.get('ClosingEncounterScene').events.once(ENCOUNTER_RESULT_EVENT, handler)` to hear the result exactly once.
3. `scene.pause()` then `scene.launch('ClosingEncounterScene', { init })` — the district scene freezes in place, the encounter renders over it.
4. On result: write `dealStatus = won|lost|deferred`, `openAccount(...)` if win, `scene.resume()`, set state back to `EXPLORING`, surface a deal toast.

## Content validation

`src/systems/content/validateContent.ts` runs at the top of `DistrictScene.create()`. It checks:

- duplicate NPC ids
- every `dialogueId` resolves to a graph
- every graph's `rootId` is in `nodes`
- every option's `next` target exists
- every `resumeRule.nodeId` exists
- every prospect seed has a matching NPC placement
- every profile derives a known archetype

A failure throws `ContentValidationError` at boot — bad content fails loudly instead of silently producing dead conversations or null encounters.

## Where M4 plugs in

The Route Book overlay reads `gameState.listAccounts()` directly. The first service-job loop will need a `JobRecord` model in `src/state/jobs.ts` and a tick-advance method on `GameState`; nothing in M3 needs to change to support it. The encounter scene is independent of the day/job model — it cares about a single negotiation, not the calendar.
