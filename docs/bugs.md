# Bugs and known issues

Tracked at the end of M6. The vertical slice is feature-complete.

## Open

### Route Book layout overflows past ~5 active accounts
Where: `src/ui/RouteBookOverlay.ts`. Each account renders three lines (~36px). With the current 4-NPC content, the overlay fits comfortably. A district with 5+ live accounts plus a churned section would push past the body area. Fix when a second district lands: paginate by account or add scroll via Up/Down keys with text-offset clamping.

### `closeDay()` event ordering is uncoalesced
Each missed-job conversion emits its own `jobStatusChanged` event, which means a multi-job day refreshes the job-ready markers N times on close. Cheap (just a few NPC sprite reads per refresh), but worth coalescing if a future district has dozens of accounts.

### Disruption pick order is insertion-only
`DisruptionController.pickFirstEligibleAccount` walks `state.listAccounts()` in insertion order. With one event and one disruption per close, this is fine. With multiple authored events (post-slice), the controller may need a priority field on `DisruptionEventDefinition` and a deterministic pick (lowest satisfaction first, highest monthly value first, etc.).

### No re-qualification path for churned accounts
Churned accounts stay in the Route Book under "Lost to IronRoot". The NPC remains in the world; engaging them shows `[E] Churned`. There's no way to re-pitch them, on purpose for the slice — but a future "win them back from IronRoot" content beat would need a structured re-engage flow.

### Bundle is one ~1.5 MB chunk
Phaser dominates. Fine for the slice; revisit when there's more game code or a launcher screen worth code-splitting on.

### Save key is hard-coded to v1
`saveSystem.ts` uses key `nrpg:save:v1`. A future schema bump that's *additive* can stay on v1; an incompatible bump should switch to `:v2` and provide a migration path or accept the wipe. The schema-version check inside the envelope is the safety net for incompatible loads either way.

### Tab key is captured by `addCapture('TAB')`
Prevents the browser from stealing focus, but only after the canvas has focus. If `Tab` doesn't open the Route Book on first try, click into the canvas once.

## Resolved

### Cadence over-extension on missed/failed work (M5)
`closeDay()` previously walked the latest *finished* job (any status) and pushed the next attempt to `lastFinishedJob.scheduledDay + cadenceDays`. A missed visit on day 15 with biweekly cadence pushed the next attempt to day 29 — punishing the customer for the player's miss. Fixed by moving the cadence anchor to `AccountRecord.nextDueDay`, which is only reset on `completed`; missed/failed work pushes catch-up to the next day.

### Brand-new accounts could auto-trigger a doorhanger (M6)
With `ACCOUNT_INITIAL_SATISFACTION = 70` (band: `watch`), the IronRoot doorhanger predicate would fire at the first day close after sign-up. Fixed in M6 by raising initial satisfaction to 78 (band: `healthy`) and adding a `validateContent` assertion that the constant resolves to the `healthy` band.

### Won-account info panel didn't surface contest state (M6)
A contested but not-yet-serviced account showed only the standard health/cadence line on the won-account info panel. Fixed in M6 by reading the active disruption in `openWonAccountPanel` and prepending the IronRoot narrative + days-remaining line when present, and recolouring the status pill to the active-disruption colour.
