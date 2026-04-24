# Playtest notes — final slice checklist

Use this checklist when running a demo or hand-off playtest. Each step has a clear pass/fail signal and an estimated time. Total: about 12-18 minutes for a full sweep.

## Setup (1 min)

1. `npm install && npm run dev`
2. Open `http://127.0.0.1:7777/` in a fresh browser context (or clear `localStorage` for the origin)
3. Confirm the district scene loads with the day banner reading **Day 1** and no Route Book toast about a save being loaded

Pass: clean Day 1 start, four NPCs visible, no save toast.

## Loop A — happy path (5 min)

4. Walk to **Jerry** (top-left house). Press `E`. Pick option `1` ("What kind of schedule are you thinking?")
5. Pick option `1` ("I do biweekly Saturdays starting at ten. $55 a visit.")
6. Pick the close ("[ Shake on it ]") to qualify

Pass: green "Jerry Porter — Qualified" toast, badge above Jerry, prompt label changes to `[E] Pitch`.

7. Re-approach Jerry. Press `E` to enter the **Closing Encounter**
8. Play `1 → 4 → 2 → 3 → 5` (Ask Need → Reassurance → Present Service → Anchor Price → Close Now)
9. Confirm the result panel reads "Deal won"; press `E` to return

Pass: account opens, `!` marker appears above Jerry, toast reads "Account opened".

10. Approach Jerry again. Press `E` to enter the **Service Job**
11. Walk into each coloured zone in turn and hold `E` until the zone "completes". Aim to clear all four within the timer
12. Confirm the result panel reads "Job complete" with a quality bucket and payout; press `E` to return

Pass: positive payout toast, Jerry's `!` marker is gone, prompt label is now `[E] Booked`.

13. Press `Tab` to open the **Route Book**. Confirm Jerry's row shows the plan, recurring value, lifetime earned, last day, satisfaction with risk band
14. Press `Tab` to close

## Loop B — Day Close + auto-save (2 min)

15. Press `N` to **end the day**
16. Confirm the Day Close panel shows: earnings, completed count, the per-job line, "Tomorrow on the route: 0 jobs" (Jerry's biweekly cadence pushes the next visit to day 15)
17. Press `E` to advance. Confirm the day banner now reads **Day 2** and the toast reads "Auto-saved"

Pass: clean roll-forward + auto-save toast.

## Loop C — save / load round-trip (2 min)

18. Press `Tab`. Note the footer reads `[S] save`. Press `S`. Toast: "Game saved"
19. Refresh the browser tab
20. Confirm the day banner restores to **Day 2**, the Route Book lists Jerry with the same lifetime earnings, and a "Save loaded — Day 2 (just now)" toast fires shortly after the scene loads

Pass: full round-trip on prospects, deals, accounts, jobs, day clock, NPC markers.

## Loop D — disruption (4 min)

21. Sign **Marcus** (top-right). Qualify via `1 → 1` ("Hedges and lawn. Flat $90 a month." → "No catch. Solo operator, lower overhead.")
22. Re-engage Marcus and play the encounter. Either play to win, or play `1 → 1 → 2` (Ask Need → numbers → "Honestly, ninety's tight. Let me think.") for a defer + retry
23. Once Marcus is signed, press `N` to end the day **without** servicing Marcus's yard
24. Confirm Day Close shows "Missed: 1" for Marcus and his health drops to ~63 (Watch band)
25. Press `E`. End day again. After enough misses (typically 1-2 more), the Day Close panel will show an "IronRoot activity" section with a doorhanger for Marcus
26. Confirm: a `RIVAL` marker pulses above Marcus, his Route Book row shows `CONTESTED`, prompt label reads `[E] Win them back`

Pass: rival event triggers cleanly, all three UI surfaces (in-world marker, Route Book tag, prompt label) reflect it.

27. **Resolve**: re-approach Marcus and complete his service job at `solid` or `pristine` quality. The result panel pays out; a delayed toast reads "Marcus Webb kept you — IronRoot rebuffed"

Pass: contest clears, marker disappears, satisfaction bumps, Route Book CONTESTED tag is gone.

## Loop E — disruption save (1 min)

28. Re-trigger a doorhanger (miss enough days, or set up another contest)
29. While the disruption is active, press `Tab → S`
30. Refresh the browser
31. Confirm the disruption persists: `RIVAL` marker, `CONTESTED` Route Book tag, deadline still counting down

## Loop F — churn (3 min)

32. From a fresh contested state, press `N` repeatedly without resolving. On the close that crosses the deadline, the Day Close panel shows "x [Customer] signed with IronRoot. Account churned."
33. Refresh the browser
34. Confirm the churned account remains in the Route Book under "LOST TO IRONROOT" and no new jobs auto-schedule for them; engaging the NPC shows `[E] Churned` and an info panel acknowledging the loss

Pass: churn persists across reload; no resurrection of new jobs.

## Reset (15s)

35. From the Route Book, press `Shift + R`. Toast: "Save cleared — refresh to start fresh"
36. Refresh. Game starts on Day 1 with no accounts.

## Regression sweep (2 min)

37. Talk to **Linda** (centre-south). Qualify via the dialogue. Confirm she defers on the first pass and the resume rule fires on follow-up
38. Talk to **Pat** (right side). Confirm she is non-prospect and the dialogue ends without setting any state
39. Esc out of every state at least once: dialogue, encounter, service job, route book, day close — confirm clean return to the district with no input lockup
40. Verify movement and collision against fences/houses still work after returning from each scene

## Build sanity (30s)

41. `npm run build` — should complete with `✓ built in ~10s`. Some Vite warnings about Tailwind/browserslist are expected and unrelated.
42. `npm run preview` — production build serves at the printed URL; spot-check that Day 1 loads
