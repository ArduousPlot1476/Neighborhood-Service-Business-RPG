# Milestones

Each milestone is strictly scoped. Do not pull future work forward.

## M1 - District exploration foundation

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

## M3 - Closing Encounter

**Status: complete.**

Delivered:

- Dedicated `ClosingEncounterScene` launched from `DistrictScene` for any NPC whose prospect status is `qualified` and whose deal status is `none` or `deferred`
- Six readable encounter meters (Interest, Trust, Budget Flex, Urgency, Margin Pressure, Composure) with per-archetype starting values
- Five data-authored actions (Ask Need, Present Service, Anchor Price, Offer Reassurance, Close Now) with per-archetype meter modifiers and reaction lines
- Four customer archetypes derived from the existing `QualificationProfile`; objection lines fire when meters drop below per-archetype thresholds
- Three encounter outcomes (win / lose / defer) with a result summary panel before returning to district
- Three separate state domains on `GameState`: `prospects` (qualification, M2), `deals` (closing lifecycle, M3), `accounts` (won-deal records, M3)
- Won deals open a minimal `AccountRecord` (npc, plan, monthly value, opening notes)
- Re-entry routing: qualified + (none|deferred) -> encounter; qualified + won -> account info panel; qualified + lost -> closed-door panel; everything else -> existing M2 dialogue
- Startup content validation: missing dialogue ids, dangling option targets, dangling resume nodes, missing prospect-NPC pairs, and unknown archetypes all throw at boot

Explicitly *not* in M3: Route Book UI, scheduling, service-job loop, day close, rivals, save/load, audio.

## M4 - Route Book + first service-job loop (next)

Goal: surface won accounts in a Route Book UI and play the first service-job loop on a real account.

Planned:

- Route Book overlay listing accounts with plan, monthly value, and last-serviced state
- A "Day" abstraction: time advances when the player triggers Start Day / End Day
- First service-job loop: walk to a booked NPC's yard, perform a minimal job action, completion writes a `JobRecord` and advances time
- Optional: stub a Day Close summary screen showing accounts touched + revenue earned

## M5 - Day cycle + service-job depth

Goal: deepen the per-day loop with travel, job quality, and customer satisfaction effects on accounts.

## M6 - IronRoot rival pressure

Goal: a visible antagonist who contests blocks you work.

## M7 - Save/load and session continuity
