# Milestones

Each milestone is strictly scoped. Do not pull future work forward.

## M1 - District exploration foundation (this milestone)

**Status: complete.**

Delivered:

- Phaser + TS + Vite skeleton with pixel-perfect rendering
- Boot -> Preload -> District scene flow
- Runtime-generated tileset and person sprite (no asset hunting required)
- Starter district "Sycamore Ridge" (50x34 tiles) with houses, yards, fences, sidewalks, road, driveways, trees, flowers, tree border
- Player with 4-direction keyboard movement, diagonal normalization, Arcade Physics body
- Collisions vs. solid tiles (walls, roofs, fences, trees) and vs. NPCs
- Camera follow with world bounds and round-pixel snapping
- 4 NPC placeholders with distinct tints, placed via data file
- Proximity-based interaction prompt
- Bottom-screen interaction panel stub (name + role + placeholder line)
- Movement locks while panel is open

Explicitly *not* in M1: dialogue branching, qualification, trust, Closing Encounter, jobs, Route Book, rival systems, save/load, audio.

## M2 - Qualification dialogue

**Status: complete.**

Delivered:

- Data-driven dialogue graph (`DialogueNode` -> `DialogueOption[]` -> optional `DialogueEffect[]`)
- Per-NPC `QualificationProfile` (service need, budget signal, objection style) seeded in `src/content/prospects/`
- In-memory `GameState` with prospect ledger: `unknown | disqualified | deferred | qualified` and a change-event hook
- Authored four conversation flows in `src/content/dialogue/starterDistrictDialogue.ts`, with at least one path each to qualified, disqualified, deferred, and a neutral non-prospect
- `InteractionPanel` upgraded to a multi-line dialogue widget with numbered choices (1-4), status pill, and a coloured speaker badge above each NPC
- Status changes surface a transient toast at the top of the screen
- Re-entering an NPC after an outcome routes through `resumeRules` so they remember
- Prompt label above an NPC reflects current status ("[E] Talk" -> "[E] Qualified" / "Follow up later" / "Not a fit")

Explicitly *not* in M2: Closing Encounter scene, trust meter, objection stack, Route Book, scheduling, jobs, rivals, save/load.

## M3 - Closing Encounter (next)

Goal: first pass at the "boss fight" closing mini-game. Triggered when a `qualified` prospect is engaged.

Planned:

- Dedicated `ClosingEncounterScene` launched from `DistrictScene` for any NPC whose status is `qualified`
- Trust meter and objection stack driven by the same `QualificationProfile` already on file
- Result writes back to the prospect ledger (Won -> a new `won` status / Lost -> `disqualified` / Rescheduled -> `deferred`)
- Scene boundary, not a controller swap — the dialogue system stays intact for future qualifiers

## M4 - Route Book and recurring work

Goal: convert won deals into scheduled recurring jobs with a calendar loop.

## M5 - Service-job gameplay

Goal: actually perform the work on-site.

## M6 - IronRoot rival pressure

Goal: a visible antagonist who contests blocks you work.

## M7 - Save/load and session continuity
