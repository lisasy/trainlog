# trainlog — build spec for Claude Code

## What this is
A mobile-responsive fitness tracker web app, terminal-inspired aesthetic.
Anchored around a monthly calendar showing which days a workout was logged.
Click a date to log/view that day's split and sets. Track PRs per exercise.
Show streaks (consecutive weeks hitting a 3+ day/week training threshold).

## Stack
- Next.js (App Router), TypeScript
- Tailwind CSS
- JetBrains Mono (next/font/google)
- Local persistence via localStorage for v1 (no backend). Wrap all storage
  access in a small `lib/storage.ts` module so it's easy to swap for a real
  DB later without touching components.
- No auth, no server — this is a single-user local app for now.

## Data model
This mirrors the user's actual current workflow (a daily "gym: done"
checkbox in a task app, plus a running per-exercise weight+date PR log in
notes) rather than a full set-by-set workout logger.

```ts
type TrainedDay = {
  date: string;    // YYYY-MM-DD
  split?: string;  // optional freeform label, e.g. "push", "legs"
  notes?: string;
};

type PREntry = {
  id: string;
  exerciseName: string; // freeform, autocompleted from prior entries
  weight: number;
  date: string;    // YYYY-MM-DD, defaults to the day it's attached to
  note?: string;   // optional freeform, e.g. "3 sets, 1:45/1:15/55s"
};
```
- `trainedDays: Record<string, TrainedDay>` — one entry per date the user
  marks as trained. This alone drives the calendar dots and the streak calc.
- `prEntries: PREntry[]` — flat, append-only, newest-last (or sort on read).
  Deliberately **not** deduped or validated against "is this actually higher
  than the last one" — the user's own log includes non-monotonic entries and
  occasional missing dates, so don't fight that; just let them add entries.
- No sets/reps array per workout day. Reps aren't tracked in the source
  workflow — don't add a required reps field, it'll create friction the
  user's current system doesn't have. `note` covers the rare cases (like
  farmer's carries) where they want extra detail.
- Streak = consecutive ISO weeks with >= 3 distinct trained dates. Compute
  from `trainedDays`; don't persist it separately.
- Current PR per exercise = most recent entry by date for that
  `exerciseName` (not necessarily max weight — trust the user's own
  ordering/log rather than recomputing "true max," since their source data
  isn't strictly increasing).

## Feature scope, in build order
1. **Calendar shell + trained toggle** — month grid, prev/next navigation,
   today indicator. Tapping a date toggles trained/not-trained directly
   (fast, matches the checkbox habit) and shows a dot when trained. Mobile:
   single column, tap targets >= 44px.
2. **Day detail sheet** — opens on a slightly longer press/tap-in on a
   date (don't make it required just to mark trained — that should stay
   one tap). Contains: optional split label, a list of any PR entries
   already attached to that date, and an inline "+ Add PR" form
   (exercise name with autocomplete from existing `prEntries`, weight,
   optional note). New PR entries default to that date.
3. **Theme system** — CSS variables (`--bg`, `--fg`, `--accent`, `--dim`,
   `--border`) driving the whole UI. 5-6 terminal presets (amber, green
   phosphor, matrix, ice, solarized, mono) plus a custom hex picker.
   Persist selected theme.
4. **PR ledger view** — a screen/tab grouping `prEntries` by
   `exerciseName`, each group sorted newest-first, current PR (most recent
   entry) highlighted at the top of its group — same shape as the user's
   existing notes-app log, just structured.
5. **Streak indicator** — small stat in the header: current streak in
   weeks, computed from `trainedDays` as described above.

Ship 1-3 first and confirm they feel right before adding 4-5.

## Design direction
- Monospace throughout (JetBrains Mono), dark background, single accent
  color per theme driving highlights/glow/focus states.
- Keep the terminal metaphor in small details, not just the font: blinking
  cursor block next to the title, `[ TODAY ]`-style bracketed buttons,
  scanline or CRT-glow texture, dot/block markers instead of dots-as-icons.
- Don't over-animate — a terminal is quiet, not flashy. One or two
  well-placed touches (blink cursor, subtle glow on accent text) beat many.

## Explicit constraints for Claude Code
- Componentize early, all hand-rolled (no UI kit), organized under
  `/components`:
  ```
  /components
    Calendar.tsx
    DayDetailSheet.tsx
    ThemePicker.tsx
    PRList.tsx
    StreakBadge.tsx
  /lib
    workouts.ts   # trainedDays CRUD + streak calc
    prs.ts        # prEntries CRUD + per-exercise grouping
    storage.ts    # localStorage wrapper, swappable later
  /app
    page.tsx      # composes the components above
  ```
  Keep each component focused on one piece of UI and free of direct
  `localStorage` calls — components read/write through `lib/`, not storage
  directly. This keeps `/components` reusable if the storage layer changes
  later.
- Type everything — no `any`.
- Mobile-first: build and test at a 390px viewport first, then verify at
  desktop widths.
- No external UI kits — hand-rolled components styled with Tailwind +
  CSS variables, to keep the terminal look intentional rather than generic.
- After each numbered feature above, stop and give me a chance to look
  before moving to the next one.

## Definition of done for v1 (features 1-3)
- I can navigate months, tap a date to mark it trained in one tap, and see
  the dot appear on the calendar.
- I can open a day's detail sheet, optionally set a split label, and
  attach one or more PR entries (exercise name + weight, optional note)
  to that date — with exercise name autocompleting from ones I've already
  typed.
- I can switch between at least 3 preset themes and set a custom color,
  and it persists across a page reload.
- Everything works at mobile viewport widths without horizontal scroll.

## Future / v2 ideas (explicitly out of scope for tonight)
- **PIN lock** — simple 4-digit PIN gating the UI on load, for
  device-privacy (not real security). Only worth adding once v1 is
  validated and only if it's solving an actual problem (shared/work
  device). Doesn't require a backend.
- Real accounts/auth only become relevant once there's a backend and data
  needs to sync across devices — not needed while this stays a
  single-device, localStorage-only app.

---

## Build decisions made during implementation

These were agreed with the user before feature 1 and are not in the original
spec:

- **Cross-device**: localStorage does not sync. The phone is the source of
  truth; a JSON export/import ships with feature 3 as a manual transfer path
  and backup.
- **Deploy**: Vercel, for an HTTPS origin (iOS persists localStorage far more
  reliably on an installed PWA than on a plain http LAN origin).
- **Day detail gesture**: long-press (~450ms) on touch; right-click or a
  corner affordance on desktop. Single tap stays "mark trained".
- **Week start**: Monday, consistent with the ISO weeks the streak calc uses.
- **`lib/dates.ts` and `lib/types.ts`** were added beyond the file list above:
  date math and shared types have no natural home in `workouts.ts`/`prs.ts`
  and both are needed by each.
- **Adjacent-month cells** in the grid are shown dimmed but are not tappable,
  so an edge mis-tap can't log a day you can't see.
