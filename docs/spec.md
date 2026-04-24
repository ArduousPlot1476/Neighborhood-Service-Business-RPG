# Spec - Neighborhood Service-Business RPG

## Concept (locked)

Explore neighborhoods, identify prospects, qualify leads, enter dedicated Closing Encounters, win recurring accounts, perform the work, and grow a small exterior-services business while resisting a corporate rival (IronRoot Property Group).

## Pillars

1. **Readable districts.** Game Boy-class clarity: a glance tells you what's a yard, what's a walkable path, what's a house, where an NPC is. Pixel-perfect scaling.
2. **Deliberate movement.** Tile-grounded top-down exploration. Keyboard-first. No fiddly controls; you can tell when you're "about to" interact.
3. **Conversation-as-gameplay.** The "boss fight" is closing a deal. Later milestones build up qualification, trust, objections, and the Closing Encounter mini-game.
4. **Small loop, visible growth.** Small routes, steady recurring jobs, a rival applying pressure to the same blocks you work. Your Route Book is the progression track.

## Near-term scope boundary (through M5)

The prospecting-to-payday arc plays end-to-end *and* now has consequences. Service quality drives account health; missed and failed visits drop satisfaction without resetting the recurring cadence; an at-risk account can be contested by IronRoot and lost outright if you ignore it.

1. Walk, qualify, close, sign — an account opens with a first job for today
2. Walk back; an `!` marks the ready yard; service the four zones under the timer
3. Quality drives the customer's satisfaction band (healthy / watch / at_risk / threatened)
4. End the day (`N`); Day Close shows earnings, per-job result, and IronRoot activity; the day advances and overdue work auto-schedules
5. If an account drifts into watch or worse, IronRoot drops a doorhanger — a `RIVAL` marker pulses above the NPC and you have 3 days to win them back with a `solid` or better service visit
6. Ignore the doorhanger and the deadline expires — the account churns to IronRoot and disappears from the active route

Save/load is still deferred to M6.

## Service Job (M4)

A separate scene, opened from the district when a booked NPC has a job ready today. The yard is a small grass rectangle with four coloured zones. Each zone has a kind (lawn / edge / beds / hedge / walkway) and a `secondsToService` cost. Stand inside a zone and hold `E`; the zone progress bar fills until the zone is done and turns its "done" colour. A 60-80 second timer counts down. Quality = average of clamped per-zone ratios. Payout = `basePayout × quality`. Pressing `Esc` finishes early; if you've cleared more than 5%, it scores as `completed` at whatever quality you reached. Jobs the day ends without finishing become `missed`.

## Route Book + day cycle (M4)

`Tab` opens the Route Book overlay. It lists every account with plan, recurring monthly value, lifetime earned, last service day, and today's job status. The header summarises day number, account count, total recurring value, and lifetime earnings.

`N` ends the day. The Day Close screen shows what was earned today, how many jobs were completed/failed/missed, the per-job breakdown, and a one-line teaser for tomorrow. On confirm, the day advances and any account whose plan cadence has come due gets a fresh job scheduled for the new day.

## Account health + cadence (M5)

Every account carries a `satisfaction` score (0-100) and a cadence anchor (`nextDueDay`):

- **Completed** service jobs adjust satisfaction by quality (pristine +12, solid +6, rough -4, unfinished -8) and reset cadence to `scheduledDay + plan.cadenceDays`
- **Failed** jobs (≤5% quality) drop satisfaction by 12 and set the next due day to *tomorrow* — the property still needs a real service visit
- **Missed** jobs (day ended without engagement) drop satisfaction by 15 and similarly schedule tomorrow's catch-up

Risk bands derive from satisfaction:

- `healthy` (75+) — green
- `watch` (50-74) — yellow
- `at_risk` (25-49) — orange
- `threatened` (0-24) — red

Bands surface in the Route Book and on the in-world prompt label. Critically, missed and failed work do *not* extend the customer's service interval — they only push the cadence anchor to "tomorrow" so you owe them a catch-up.

## IronRoot disruptions (M5)

The first authored rival event is the **IronRoot Doorhanger**. At day close, any non-churned account in `watch` or worse can be contested. The event:

- applies an immediate satisfaction penalty (-8)
- sets a 3-day deadline
- shows a pulsing `RIVAL` marker on the NPC
- adds a `CONTESTED` tag in the Route Book
- changes the in-world prompt to `[E] Win them back`

To resolve: complete the contested account's next service job at `solid` or `pristine` quality. Resolution clears the marker and bumps satisfaction by +10. Each day the doorhanger sits unaddressed, satisfaction drifts down by another -4. If the deadline passes unresolved, the account churns: it stays in the Route Book under "Lost to IronRoot" but no further jobs schedule for it.

The disruption system is registry-driven. Future rival events are content-only additions to `disruptionEvents.ts`.

## State domains

Five separate state stores, one per concern. They are deliberately not collapsed.

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

**Account (M3, extended in M4)** — record of a won deal: plan, monthly value, opening notes, plus running totals (`lastServicedDay`, `totalEarnedCents`, `jobsCompleted`). Surfaced in the Route Book.

**Job (M4)** — a scheduled (or completed) piece of work for an account.
- `scheduled` — exists, hasn't been done yet
- `in_progress` — currently inside the Service Job scene
- `completed` — done; carries quality bucket and payout
- `failed` — engaged but did not clear meaningfully (≤5% score)
- `missed` — day ended without engagement

**Disruption (M5)** — a rival event targeting one account.
- `active` — the contest is live; affects satisfaction and is visible everywhere
- `resolved` — the player completed a high-enough quality service visit before the deadline
- `expired` — the deadline passed; the account churns

Outcomes never cross domain boundaries. A `qualified` prospect whose deal is `lost` stays `qualified`. An account whose job is `missed` stays a `won` deal. A `churned` account is still a `won` deal — the loss lives at the account/disruption layer, not the qualification layer. This separation lets M6+ persist and replay the world without state ambiguity.

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
- Hold to service a job zone: `E` (while standing in a coloured zone)
- Open / close Route Book: `Tab`
- End day: `N`

Gamepad and touch are out of scope for now.

## Tech constraints

- Browser-first (no Electron, no native shell)
- Stack: Phaser 3 + TypeScript (strict) + Vite
- Pixel rendering: `pixelArt: true`, `roundPixels: true`, `antialias: false`, scale mode `FIT`
- Internal resolution: 640x360; tile size: 16px
- No giant manager classes; prefer small modules and data files
- Content lives in `src/content/` so scenes do not embed gameplay data
