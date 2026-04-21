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

## M2 - Qualification dialogue (next)

Goal: make NPC interactions meaningful as the first step of the prospecting loop.

Planned:

- Replace single-line panel with a data-driven dialogue graph (prompt -> options -> outcome)
- Introduce per-NPC "qualification profile" (service need, budget signal, objection style)
- Add a simple prospect status ledger in memory (Unknown / Qualified / Not a fit / Already booked)
- Add an on-screen minimap or Route Book stub that lists discovered prospects
- Keep dialogue data in `src/content/dialogue/`

## M3 - Closing Encounter (prototype)

Goal: first pass at the "boss fight" closing mini-game.

Planned:

- Dedicated `ClosingEncounterScene`
- Trust meter and objection stack
- Result writes back to the prospect ledger (Won / Lost / Rescheduled)

## M4 - Route Book and recurring work

Goal: convert won deals into scheduled recurring jobs with a calendar loop.

## M5 - Service-job gameplay

Goal: actually perform the work on-site.

## M6 - IronRoot rival pressure

Goal: a visible antagonist who contests blocks you work.

## M7 - Save/load and session continuity
