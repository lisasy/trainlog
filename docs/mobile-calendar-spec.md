# Mobile calendar — implementation spec

Design-engineering spec for five issues Lisa raised against the phone calendar
(`≤1023px`). Reviewed running at 390×844 (Chrome, DPR 2) at commit `c03cd73`,
plus a full read of `Calendar.tsx`, `DayCell.tsx`, `CurrentCard.tsx`,
`MobileDock.tsx`, `DayCardContent.tsx`, `app/page.tsx`, `lib/cameraZoom.ts`, and
the `.week-stack` / `.sheet-grow-*` / `today-*` rules in `app/globals.css`.

Lucy implements. This is the visual/layout contract only — no component code
here. Screenshots referenced live in the review scratchpad
(`01-month-rest` … `08-month-after-zoom`).

Terminal-restraint rules still apply (`CLAUDE.md`, `docs/design-audit.md`):
one type size, hierarchy from color/position, motion short and interruptible,
`PRESSABLE` + `FOCUS_RING` on every control, accent spent on one thing per
screen.

---

## Layout model — what stays fixed vs. what animates

The whole redesign hangs on one decision: **the day cell is a fixed size and
never resizes.** Everything else is layout around it.

| Element | Rest (no day selected) | Day selected (week focus) | Animated property | Duration / ease |
|---|---|---|---|---|
| **Day cell** (w × h) | fixed: `~48 × 56` px | **unchanged** | none — never resizes, ever | — |
| Weekday header row | visible, pinned | visible, pinned (does not move) | none | — |
| `.week-stack` grid rows | `repeat(weekCount, var(--day-row))` fixed px | same fixed px | none | — |
| `.week-stack` vertical position | `translateY(0)` | `translateY(-(weekIndex × var(--day-stride)))` | `transform` | `--sheet-duration` `--sheet-ease` |
| Calendar board height | `flex-grow: 1` (fills to dock) | `flex-grow: 0` → collapses to header + 1 row (`~92px`) | `flex-grow` | `--sheet-duration` `--sheet-ease` |
| Calendar board `overflow` | `hidden` | `hidden` — clips the non-focused weeks | none | — |
| CurrentCard / dock | stats body, height hugs content | **fixed target height** `min(62dvh, …)`, `flex-grow: 1` | `flex-grow` | `--sheet-duration` `--sheet-ease` |
| Selected-cell ring | absent | `ring-1 ring-inset ring-fg/70` fades in | color/opacity (fold into `PRESSABLE` transition list) | `100ms` |
| Month ↔ year swap | — | (separate gesture, see §5) | `opacity` cross-fade only | `140ms ease-out` |
| Today marker pulse / lightning | looping (existing) | unchanged | existing | existing |

`--sheet-duration` (`420ms`) and `--sheet-ease` (`cubic-bezier(0.32,0.72,0,1)`)
already exist and are correct — reuse them. Everything in the "week focus"
transition runs on that one pair so the calendar collapse, the stack slide, and
the sheet grow move as one gesture. All of it is disabled under
`prefers-reduced-motion` (the media query at `globals.css:376` already covers
`.week-stack` and `.sheet-grow-*` — extend it to the new transform).

Tokens to add to `:root` (`globals.css`):

```
--day-cell-h: 56px;   /* fixed day-cell height, phone */
--day-row: 56px;      /* .week-stack grid row track */
--day-stride: 60px;   /* --day-row + row gap (4px) — the translateY unit */
--year-cell: 9px;     /* year-view day-cell edge (see §4) */
```

Cell height may be tuned ±4px; keep `--day-cell-h ≥ 44px` (touch target) and
keep `--day-stride = --day-row + gap-y`.

---

## 1. Month-view cell-height jank

### What's happening now

`MonthDayGrid` (`Calendar.tsx:72–111`) builds the week rows as
`weeks.map(() => "minmax(0, 1fr)")` and the `.week-stack` container is
`h-full min-h-0 flex-1` (`Calendar.tsx:77`). Each week's inner grid is
`grid-rows-1` + `h-full` (`Calendar.tsx:91`), and each `DayCell` is
`h-full` (`DayCell.tsx:83`). So every cell's height is
`(calendar area − header) ÷ weekCount`.

The calendar area is whatever vertical space the dock leaves. The dock
(`MobileDock` → `CurrentCard`) is content-hugging with `max-h-[42dvh]`
(`CurrentCard.tsx:158`). Its height changes with **what you tapped**:

- Tap an unlogged day (e.g. today `09`): body is just "Mark Completed" + empty
  PR list → card `~170px` → cells render `~85px` tall (measured; screenshot
  `04-tap-today09`).
- Tap a logged day with a split + a PR (e.g. `04`): body adds the 4-up split
  grid + a PR row → card `~380px` → cells shrink to `~100–110px`
  (screenshot `03-tap-day04`).

Net: the entire grid re-flows every tap, cells jump `~25–40px` in height, and
because the columns are `1fr` the *empty* trained-day highlights become tall
bars with the date pinned to the top (also called out in `design-audit.md`
§3 "Layout / responsive bugs").

### Target

Day cells are a **fixed height, always** — independent of month density, of
which day is selected, and of the dock's height.

- `.week-stack` grid rows become `repeat(var(--week-count), var(--day-row))`
  (fixed px), replacing the `minmax(0,1fr)` join at `Calendar.tsx:73`.
  Keep `align-content: start` and `gap-y-1` (4px).
- Drop `flex-1` / `h-full` stretch on `.week-stack`; it is now
  `height: max-content`.
- `DayCell` root: replace `h-full min-h-0` with the fixed box —
  `h-[--day-cell-h] w-full`. The cell stays `flex flex-col items-center`,
  number at top, marker slot below (unchanged internals).
- Cell dimensions at 390px: width `≈ 48px`
  (`(390 − 28px board px − 24px col-gap) ÷ 7`), height `56px` → a calm ~6:7
  portrait tile. `≥ 44px` in both axes, so the touch target is honest.
- At rest the grid is shorter than the available area. Top-align it under the
  weekday header (`align-content: start` already does this) and let the leftover
  space fall between the grid and the resting stats card — that gap is
  acceptable and reads calmer than stretched cells (see settled screenshot
  `08-month-after-zoom`, which already has this gap and looks right).
- Desktop (`≥1024px`) is unchanged: the `@media (min-width:1024px)` block in
  `globals.css:364` keeps `.week-stack` on `1fr` rows and `flex-grow: 1`. Only
  add: on desktop, ignore `--day-row` and keep the current fill behavior.

### Acceptance check

1. Open the calendar. Tap `09` (unlogged), read a cell's height in devtools.
   Tap `04` (logged, has split + PR). The cell height is **identical** to the
   pixel. Tap every logged day in the month — no cell ever changes height.
2. No trained-day fill is ever a tall bar with the number floating at the top —
   the fill is the cell, the cell is `56px`.
3. Weekday header (`sun mon …`) stays on the same Y the whole time.

---

## 2. Week-focus on tap

### What's happening now — vs. intent

The scaffold exists but nothing drives it:

- `.week-stack` (`globals.css:357`) has
  `transition: grid-template-rows var(--sheet-duration) var(--sheet-ease)` —
  but `--week-rows` is set once from `weeks.map(() => "minmax(0,1fr)")`
  (`Calendar.tsx:73,80`) and **never changes** when a day is selected. So the
  transition target is always the same value; it never fires.
- `.sheet-grow-cal` / `.sheet-grow-dock` (`globals.css:350`) are defined —
  the intended calendar↔dock `flex-grow` trade — but **grep finds zero
  usages** in `components/`. The classes are dead.
- `CurrentCard` is explicitly *not* a fill-the-gap sheet: the comment at
  `MobileDock.tsx:15` says "height hugs content." So today, tapping a day just
  drops a taller content-hugging card in front of a squished full grid
  (screenshots `02`–`05`). No week isolation, no calendar Y-shift, no eased
  hand-off.

Intent (Lisa): tap a day → the sheet grows to a stable working height **and**
the calendar shifts so only that day's week shows above the sheet.

### Target — mechanics

Three things move together, all on `--sheet-duration` / `--sheet-ease`:

**a. The dock grows to a fixed height.**
Wire `.sheet-grow-dock` onto the dock's growable wrapper and `.sheet-grow-cal`
onto the calendar column (the `<div className="flex min-h-0 flex-1 flex-col">`
at `page.tsx:438` and the dock wrapper in `MobileDock.tsx:33`). When
`sheetDate !== null`:
- calendar column `flex-grow: 1 → 0`
- dock `flex-grow: 0 → 1`
- The dock's `CurrentCard` drops `max-h-[42dvh]` and content-hug while a day
  sheet is open; instead it fills its flex space up to a cap of
  `min(62dvh, 520px)`. Its body scrolls internally (`overflow-y-auto`,
  already there for the non-fill branch) if the split + PRs overflow.
- Result: the sheet is the **same height whether the day is logged or not** —
  killing the feedback loop that caused issue 1.

**b. The calendar board collapses to one week.**
The board (`Calendar.tsx:308`, `<div ref={boardRef} className="relative
min-h-0 flex-1">`) is already `overflow-hidden` on its parent `<section>`
(`Calendar.tsx:306`). Keep `overflow: hidden` on the board itself too. When a
day is selected, the board's flex-grow goes to 0 and its height eases down to
`weekdayHeader (28px) + 1 × --day-row (56px) + a little breathing room` ≈
`92px`.

**c. The week strip slides to the selected week.**
`.week-stack` gets `transform: translateY(calc(-1 * var(--focus-week) *
var(--day-stride)))`, where `--focus-week` is the 0-based row index of
`sheetDate` within `buildMonthGrid(month)` (compute in `MonthDayGrid`,
set as a CSS var alongside `--week-rows`). At rest `--focus-week: 0` and the
board is tall enough to show all rows, so the translate is invisible; when the
board collapses, the translate brings the selected week directly under the
header. Add `transform` to the `.week-stack` transition list (it currently only
transitions `grid-template-rows`):
`transition: transform var(--sheet-duration) var(--sheet-ease), grid-template-rows …`.

Non-focused weeks stay mounted and simply clip — cheaper than animating grid
tracks to `0`, and the fixed-size cells never reflow.

**d. Closing.** Reverse all three. `sheetDate → null` restores
`--focus-week: 0`, `flex-grow` 1/0, board grows back, stack slides home.

**e. Keep the weekday header visible** above the focused week the whole time —
it's the only remaining "this is a calendar" cue while collapsed.

**Do not** add a scrim, a drag handle, or a spring. This is a flex/transform
hand-off, nothing more.

### Acceptance check

1. Tap `18` (week 3). Over ~420ms: the stats card grows into a day sheet that
   fills most of the screen; the calendar above it eases down to the weekday
   header + **only the `13–19` row**; weeks 1, 2, 4, 5 are clipped, not
   visible. Number cells never change size during the move.
2. Tap `04` then `20` then `09` without closing — the sheet height does **not**
   change between them (only the calendar row shown changes).
3. Hit `close` / Esc — calendar eases back to the full fixed-size grid, sheet
   returns to the resting stats card. No jump at either end.
4. `prefers-reduced-motion`: same start/end states, zero animation.
5. Desktop unaffected — the rail still holds the form, calendar stays full.

---

## 3. Completed-past-date cell state

### What's happening now

`DayCell.tsx:82–96` is a single ternary chain. A past logged day (not today,
not future) lands on `isTrained ? "bg-surface hover:bg-fg/5"` with a
`bg-logged` dot (`DayCell.tsx:123`). Problems:

- `--surface` (`#242424`) over `--bg` (`#191919`) is a `~1.5:1` fill — at a
  glance a logged past day is nearly identical to an empty one. The only real
  signal is a `6px` dot.
- `isSelected` sits **above** `isTrained` in the chain
  (`DayCell.tsx:90–95`), so selecting a logged day *replaces* its fill with
  `bg-fg/10` — the "completed" identity disappears exactly when you're looking
  at it. Screenshot `02-tap-day03`: day `03` is selected and logged, and is
  visually indistinguishable from selected-and-empty.
- Net: "completed past day" is not a distinct state, and "selected" destroys
  whatever state the day had.

### Target

Make selection an **orthogonal ring**, not a fill swap, and give completed a
quiet warm identity of its own.

**Restructure the cell into two independent layers:**

1. **Identity fill + marker** — decided by the day's own status, always
   rendered:

| Day status | Fill | Number | Marker (below number) |
|---|---|---|---|
| Unlogged (past / other-month in range) | none · `hover:bg-surface/60` | `text-dim` | none |
| **Completed past (NEW)** | `bg-logged/12` | `text-fg` | filled `bg-logged` dot, ø `6px` |
| Future scheduled (`isTrained && isFuture`) | `border border-dashed border-fg/25` · `hover:bg-surface/40` | `text-dim` | `bg-dim` dot, ø `6px` |
| Today, unlogged | `bg-surface/80` + `border border-accent/70` + lightning SVG | `text-fg` | hollow accent ring dot (existing pulse) |
| Today, completed | `bg-logged/12` + `border border-accent/70` + lightning SVG | `text-fg` | filled `bg-logged` dot |

2. **Selection ring** — `isSelected` adds, on top of any of the above:
   - `ring-1 ring-inset ring-fg/70` for non-today cells
   - `ring-1 ring-inset ring-accent` for today (today already owns the accent)
   - The day's fill and marker stay exactly as in the table. Selecting a
     completed day = warm fill + logged dot + `fg` ring.
   - Keyboard cursor (`isCursor`) stays `ring-1 ring-inset ring-fg/60`; when a
     cell is both cursor and selected, selected wins (drop the
     `!isSelected` guard at `DayCell.tsx:87` — the selected ring is the
     stronger of the two and they're the same treatment).

**Spec details for the new completed-past fill:**
- `bg-logged/12` — a warm wash (`--logged` is the warm accent hue). Distinct
  from `bg-fg/10` (neutral — now the *selected-empty* look) and from
  `bg-surface` (structural). Resolves to `≈ #2b2620` on the default theme.
- Number goes to `text-fg` (full strength) — a completed day has earned a
  brighter numeral; this is the "color carries hierarchy" rule, not size.
- Contrast: `--fg` on `bg-logged/12` clears `> 7:1`. The `--logged` dot on that
  fill clears `3:1` (non-text indicator). Both pass.
- Radius unchanged (`rounded-md`, per current `DayCell`).
- No new border. The fill + the existing dot do the work; a border here would
  collide with the dashed "scheduled" border and the accent "today" border.

**Split label:** unchanged — the `lg`-only `Tip` (`DayCell.tsx:115`) stays
desktop-only.

### Acceptance check

1. In a month with history, an empty day, a completed past day, a future
   scheduled day, today, and a selected day are all **immediately
   distinguishable** without hovering:
   - empty → flat, dim number, no dot
   - completed → warm-tinted tile, bright number, solid warm dot
   - scheduled → dashed outline, dim number, grey dot
   - today → accent outline + animated ring dot
   - selected → any of the above **plus** a crisp 1px inset ring
2. Select a completed past day: it still reads as completed (warm fill + warm
   dot both visible) with a ring added — compare against screenshot
   `02-tap-day03` where that identity is currently lost.
3. Select an empty day: neutral `bg-fg/10` + ring, no warm tint, no dot.
4. Today + completed: accent border AND warm fill AND solid dot coexist.
5. Contrast: sample the completed number against its fill — ≥ 4.5:1.

---

## 4. Year-view cell shape

### What's happening now

`DayCell.tsx:44–62` is a separate `density === "year"` branch that returns a
bare `<span>` — `h-full min-h-0 w-full rounded-[2px]` with
`bg-fg/10` / `bg-scheduled` / `bg-logged`. Inside `.week-stack` those spans are
laid out with `grid-rows-1` in a mini-month whose container is short and
whose 7 week-columns are ~4px wide, so each "cell" renders as a **~4 × 30px
vertical bar**. The result reads as a barcode / audio waveform
(screenshot `06-year-view`), nothing like the rounded day tiles of month view.
The `bg-fg/10` empty cells are nearly invisible, so sparse months look broken.

### Target

Year view is the month grid **shrunk uniformly** — same cell shape, same fill
logic, just smaller and without the number. Lisa's rule: *proportional to month
view and not changing shape.*

- **Day cell in year view is a square**, edge `= var(--year-cell)` (`9px`,
  tune `8–10px`). `aspect-ratio: 1`. It is the month cell's shape at a smaller
  fixed size — not a `1fr`-stretched bar.
- `.week-stack` in year density uses
  `grid-template-rows: repeat(var(--week-count), var(--year-cell))` (fixed px,
  same pattern as the month fix in §1) — **not** `minmax(0,1fr)`. Row/col gap
  `2px`.
- Mini-month footprint: `7 × 9px + 6 × 2px = 75px` wide, `≤ 6 rows × 11px ≈
  66px` tall. Four per row fits 390px with the existing
  `grid-cols-4 gap-x-4` (`Calendar.tsx:310`).
- **Fill logic = the same four tones as month view, scaled:**

| Day | Year-view fill |
|---|---|
| Completed (past logged) | `bg-logged` (solid) |
| Scheduled (future logged) | `bg-scheduled` (solid) |
| Empty, in-month | `bg-fg/15` (raise from `/10` so sparse months still read) |
| Out-of-month padding | nothing (`aria-hidden` empty box — current behavior) |
| Today | any of the above + `ring-1 ring-inset ring-accent` (current behavior, keep) |

- Radius: `rounded-[2px]` (a 9px square with 6px radius would be a circle).
  This is the one place `rounded-[2px]` is allowed — it's `rounded-md` scaled
  to the cell.
- **The only thing that changes between month and year is: absolute size, and
  the number is dropped** (unreadable at 9px — acceptable density reduction).
  Everything else — square shape, fill palette, today ring — is identical.
- The paint-only branch can stay a separate return path in `DayCell` (it's
  genuinely a different element — no button, no number), but its **output must
  be a square that visually matches a scaled month cell**, not a bar.

### Acceptance check

1. In year view, one mini-month's cells are recognizably the **same square
   tile shape** as a month-view day cell — hold a month-view screenshot next to
   a year-view mini-month; the cell reads as the same object at two sizes.
2. No cell is a thin vertical bar. Each is within 1px of square.
3. A month with 3 logged days shows 3 solid warm squares on a grid of faint-but-
   visible empty squares — not 3 bars floating in near-black
   (compare screenshot `06-year-view`).
4. Today's cell in the current month carries the accent ring.
5. Switching a day from logged→unlogged in month view, then going to year view,
   changes that one square from `bg-logged` to `bg-fg/15` — same position, same
   size.

---

## 5. Year → month transition — **CUT the zoom**

### What's happening now

`lib/cameraZoom.ts` + `playFlip` (`Calendar.tsx:200–240`) run a FLIP:
the tapped month module is promoted to an absolutely-positioned `bg-bg` layer
(`MonthModule` `lifted` branch, `Calendar.tsx:132–135`), its internals swap
from year-density to month-density, and it's transform-inverted from its
mini-month rect to the full-pane rect and eased over `YEAR_ZOOM_MS` (480ms).

Rendered result (screenshot `07-year-to-month-mid`): the other 11 month
modules are still painted at their year positions, half-faded — `JAN FEB MAR
APR` labels bleed through the top, `APR`'s heatmap bars hang as a dashed column
on the right. The promoted layer shows a doubled label (`September` title +
`SEP`) over a grid of large empty rounded rectangles that scales up from the
corner. `transformOrigin: 0 0` with a forced-uniform scale (the mini-month
aspect ≠ the pane aspect — `cameraZoom.ts:9–11` concedes this and fakes it)
distorts the whole thing. It reads as broken.

### Recommendation: **remove it. Replace with an instant layout swap + a 140ms opacity cross-fade.**

Reasoning:

1. **The two grids don't share cell geometry.** Month cells are `48×56`
   numbered tiles; year cells are `9px` squares. A shared-element zoom between
   them can never be a true match — the current code already gives up and
   forces a uniform scale, which is the distortion you see.
2. **A correct FLIP here is expensive.** It would need a coordinated crossfade
   of all 11 other modules, a clean label swap, and a way to not reflow the
   promoted module's internals mid-flight. That's a lot of machinery for a
   sub-500ms flourish that fires on a deliberate navigation the user already
   understands ("I tapped September, I get September").
3. **It's against the house style.** `docs/design-audit.md` §5: motion is "a
   press response and a single state transition, nothing that loops or
   sparkles." A camera-zoom between views is decoration, not information.
4. **Deleting it removes ~120 lines** — all of `lib/cameraZoom.ts`, `playFlip`,
   the `lifted` / `surface` / `anim` state machine and the `firstRect` /
   `layerEls` / `slotEls` ref plumbing in `Calendar.tsx` — and makes the
   `MonthModule` `lifted` branch unnecessary.

### Target

- Tapping a mini-month (`pickMonth`, `Calendar.tsx:242`) sets `month` and clears
  `yearView` — the grid re-renders month-density in place, **no transform**.
- Wrap the calendar `<section>`'s grid in a keyed container
  (`key={yearView ? 'year' : monthKey(month)}`) and fade the incoming content:
  `opacity: 0 → 1` over `140ms ease-out`. Outgoing is not animated (it's
  replaced) — a plain cross-fade via two stacked layers is fine but not
  required; a straight 140ms fade-in of the new grid is enough.
- The tapped mini-month cell gets the normal `PRESSABLE` press feedback on tap
  (it already has `active:brightness-90` at `Calendar.tsx:367` — keep it; it's
  the whole acknowledgement needed).
- `prefers-reduced-motion`: no fade, instant swap.
- Same treatment for month → year (the `2026` chip / `openYearView`).

### Optional (only if Lisa wants a hint of spatial continuity)

Add a `scale(0.97) → 1` alongside the opacity fade **on the incoming month grid
only** — no FLIP, no rect math, no sibling coordination. Same `140ms ease-out`.
It gives a faint "settling into place" without any of the distortion risk. My
call: ship the plain fade first, add this only if the swap feels too abrupt in
the hand.

### Acceptance check

1. From year view, tap September → the month grid appears in `≤ 150ms` with a
   clean fade, no scaling, no doubled labels, no ghost of the other months
   (compare screenshot `07-year-to-month-mid`).
2. `lib/cameraZoom.ts` is deleted (or reduced to nothing imported); `playFlip`
   and the `anim` ref state machine are gone from `Calendar.tsx`.
3. Rapidly tapping the `2026` chip in and out of year view never leaves a
   half-transformed or double-rendered frame.
4. `prefers-reduced-motion`: instant, no fade.
5. The settled month view is unchanged from today's end state (screenshot
   `08-month-after-zoom` — that part already looks right).

---

## Out of scope (noted, not specified here)

- **Loading state** (`page.tsx:426`): the bare `loading…` string, and the dock
  rendering `Today / UNDEFINED UNDEFINED NAN, NAN / STREAK 0` before mount
  (screenshot `01-month-rest`) — `fullDateLabel("")` on an empty `todayKey`.
  Wants a static grid skeleton and a guard. Logic + a skeleton component —
  Lucy's call, tracked in `design-audit.md` P2-6.
- The `2026` chip, `:)` face button, and `today` / `TODAY` casing — already in
  `design-audit.md`.
- Dropping the dashed "scheduled" border in favor of a hollow dot
  (`design-audit.md` P2-3) — leave the dashed border for now; §3 above depends
  on it staying as the scheduled signal.
