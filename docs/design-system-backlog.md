# trainlog — design-system backlog (consolidated)

The single execution list for the migration off the terminal aesthetic toward a
small, restrained, iOS-ready system. Merges the mechanical refactor plan with
Iris's taste cut-list.

- **Rationale / taste narrative:** `docs/design-audit.md` (Iris) — the "why," the
  keep/soften/cut table, the north-star statement, the target-system table.
- **Living reference:** `/theme` (`app/theme/page.tsx`) — tokens and components as
  they actually render today.
- **This file:** what to do, in what order, with file:line and effort.

**Priority**

- **P0** — a correctness or accessibility defect, or a primitive so widely
  duplicated it blocks the rest.
- **P1** — the simplification itself: real inconsistency a user or developer
  feels. Do right after P0.
- **P2** — cleanup, dead code, single-use seams, deferred taste calls.

**Effort** — S ≈ <1h · M ≈ half-day · L ≈ multi-day.

**Target home:** `components/ui/` (primitives) + `lib/tokens.ts` (scale) +
`lib/styles.ts` (shared class strings). Everything below imports from there.

> Snapshot note. The audit was taken against the working tree on 2026-09-06.
> That tree also carries unrelated in-progress work (a mobile calendar rebuild;
> a "today cell" stroke animation). Re-check each dead-code item against current
> `git grep` before deleting — some may already be resolved or newly in use.

## Progress

**Primitive layer landed** (`components/ui/`, first pass):

- ✅ **P0.4** `FOCUS_RING` + **P1.17-partial** `SECTION_LABEL` — `lib/styles.ts`;
  migrated in BottomNav, DayCell, DayForm, MonthDropdown (incl. the P0.3
  invisible-focus fix on the `path` variant), Calendar, ThemeFaceButton,
  Sidebar, PRList, ThemePicker.
- ✅ **P0.2** input font-size — `<Field>` sets `text-base` (16px); iOS no longer
  zooms on focus.
- ✅ **P0.5** `<Field>` — `components/ui/Field.tsx`; PRForm (4 inputs) + the theme
  sheet's accent input. `fieldClass` deleted.
- ✅ **P0.6** `<Button variant>` — `components/ui/Button.tsx` (`primary` /
  `quiet` / `ghost`, `sm` / `md`). PRForm `PRIMARY`/`GHOST` deleted; `NavButton`
  is now a thin alias; ThemePicker `[ bracket ]` buttons → `<Button>` (brackets
  dropped); PRList "+ add pr" → `<Button>`.
- ✅ **P0.7** `<TextAction>` — `components/ui/TextAction.tsx`; the `LINK` const
  and 4 inline `.link` copies (DayCardContent ×3, DayForm, Sidebar, PRForm).
- ✅ **P1.9** `<IconButton>` — `components/ui/IconButton.tsx`; DayForm remove-`X`,
  PRList per-group `+` (both now real 36px hit targets, `PRESSABLE` + ring).
- ✅ **P1.18** `<Weight>` — `components/ui/Weight.tsx`; PRList local copy + the
  DayForm inline version collapsed onto it.
- `/theme` updated to document the primitives; `docs/design-audit.md` unchanged.

**Deferred** (need a design call or entangle with the just-committed mobile
rebuild): P0.1 contrast, P0.8/P0.9 (dead CSS / blink), P1.1-full, P1.2 radius,
P1.3 type ramp, P1.4 one theme, P1.5 `.glow`, P1.6 chrome text, P1.7 one
"add PR", P1.11 `<OptionGroup>`, P1.13 `<Chip>`, P1.14–P1.16, P1.19, all P2.

---

## P0 — correctness, accessibility, foundational primitives

### P0.1 — `--dim` text on `--surface` fails WCAG AA · S
`--dim` (`#898180`) is ~3.7:1 on `--surface` (`#242424`); it was only ever tuned
to clear 4.5:1 on `--bg`. Every `text-dim` inside a `bg-surface` card fails:
`HEADER_CHIP` year + `TODAY` (`components/Calendar.tsx:39-40`), the FormHeader
prompt line (`components/DayCardContent.tsx:15-24`), inactive split-tile labels
(`components/DayForm.tsx:48`).
**Target.** Either stop putting muted text on surface (promote those to
`text-fg`, let position carry hierarchy), or add a `--dim-strong` token that
clears 4.5:1 on surface and use it on cards. Pick one, document it in the
`/theme` colour section.

### P0.2 — Inputs are 13.6px, so iOS zooms on focus · S
`body` is `font-size: 0.85rem` (`app/globals.css`, ~13.6px); the rule's own
comment claims 16px "so iOS doesn't zoom on input focus." It doesn't, and every
`<input>` inherits it (`FIELD` `components/PRForm.tsx:36-37`, `fieldClass`
`components/ThemePicker.tsx:60-61`).
**Target.** Set input font-size to exactly `16px` in the `<Field>` primitive
(P0.5), or raise the body to `1rem` and re-tune layout. Fix the comment.

### P0.3 — Restore focus visibility on the desktop month switcher · S
`MonthDropdown` `path` variant sets `focus-visible:outline-none` with no
replacement (`components/MonthDropdown.tsx`) — invisible keyboard focus on a
primary nav control. Give it the shared focus ring (P0.4). (If the `path`
variant is removed in P1.6, this collapses into that.)

### P0.4 — Shared focus-ring token · S
`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset
focus-visible:ring-accent` is pasted verbatim in 9 components; `Sidebar` +
`PRList` use `ring-1`; `.link` actions use a text-colour shift instead.
Call sites: `NavButton.tsx:24`, `BottomNav.tsx:39`, `DayCell.tsx:57`,
`DayForm.tsx:47`, `MonthDropdown.tsx:59`, `Calendar.tsx:186,208`,
`PRForm.tsx:40,43`, `PRList.tsx:40`; `ring-1` `Sidebar.tsx:36`.
**Target.** `FOCUS_RING` export in `lib/styles.ts` next to `PRESSABLE`; one ring
width app-wide; fold into the `<Button>` / `<IconButton>` / `<Field>` primitives
so most call sites stop naming it.

### P0.5 — `<Field>` text-input primitive · M
One input style, defined twice and drifting: `FIELD` (`PRForm.tsx:36-37`,
`rounded-lg border-border bg-bg/40`) vs `fieldClass` (`ThemePicker.tsx:60-61`,
`rounded-none bg-transparent`, no transition).
**Target.** `<Field>` / `<Field as="date">` in `components/ui/Field.tsx`. Owns
the 16px font-size (P0.2), focus treatment, `color-scheme: dark` for the native
date input (`PRForm.tsx:159`), disabled + invalid states. Used by `PRForm` (4
inputs) and `ThemePicker` (1).

### P0.6 — `<Button variant>` primitive — collapse 8 styles → 3 roles · L
Distinct button treatments in use: `NavButton` filled; `DayForm` split tiles;
`PRForm` `PRIMARY` / `GHOST` (`PRForm.tsx:39-43`); `[ bracket ]` text buttons
(`ThemePicker.tsx:83-88,152-206`); `.link` dotted text actions; `PRList`
`+ add pr` (`PRList.tsx:38-42`); `PRList` bare `+` (`PRList.tsx:61-68`);
`ThemePicker` preset rows; `HEADER_CHIP` used as both label and button
(`Calendar.tsx:39-40`).
**Target — three roles, defined in `lib/styles.ts` / `components/ui/Button.tsx`,
each always including `PRESSABLE` + `FOCUS_RING`:**
- **Primary** — `bg-accent text-bg`, one per screen. → iOS `.borderedProminent`
- **Quiet** — `bg-surface text-fg hover:bg-border`. → iOS `.bordered`
- **Link** — `<TextAction>` (P0.7). → iOS `.plain`
Retire `PRIMARY`/`GHOST`, all `[ bracket ]` buttons, `+ add pr`, the bare `+`,
the `:)` button, both `HEADER_CHIP` roles. `NavButton` becomes
`<Button variant="quiet" size="sm">` with its `emphasis` → `variant="primary"`.

### P0.7 — `<TextAction>` for `.link` actions · S
`.link` (`app/globals.css:175-186`) always ships with the same trailing
`cursor-pointer … hover:text-accent focus-visible:text-accent
focus-visible:outline-none` string, hand-typed 5× (`LINK` const
`DayCardContent.tsx:11-12`; inline `DayCardContent.tsx:210`, `DayForm.tsx:60`,
`Sidebar.tsx:50`, `PRForm.tsx:169`).
**Target.** `<TextAction onClick>` / `<TextAction href>` in
`components/ui/TextAction.tsx`, wrapping the class + colour shift. Keep the CSS
class (it's the shared dotted vocabulary); stop repeating the Tailwind tail.

### P0.8 — Delete dead terminal CSS · S
`.scanlines` (`app/globals.css` ~135-153) and `.glow-box` (~131-133) are defined
and never mounted. Zero visual change. *Re-check `.glow-box` first* — the
in-flight "today cell" work may have started using it.

### P0.9 — Remove the infinite blink · S
`.cursor-block` (`app/globals.css` ~79-92) + its element (`Sidebar.tsx:20-23`) +
its reduced-motion override. A permanently animating element beside a title is
exactly what "restrained" rules out.

### P0.10 — Normalize `aria-current` · S
`Sidebar.tsx:33` uses `"true"`; `BottomNav.tsx:38` uses `"page"` for the
identical purpose. Standardize on `"page"`.

---

## P1 — the simplification

### P1.1 — Apply `PRESSABLE` to every remaining control · M
The documented house contract (`CLAUDE.md`) is on ~5 of ~19 interactive
surfaces. Add to: `DayForm` split tiles, all `PRForm` buttons, `PRList` rows +
adders, `ThemePicker` rows, `Sidebar` nav rows, `MonthDropdown` options + path
trigger, `FormHeader` close, autocomplete suggestions. Fold any existing
`transition-colors` into `PRESSABLE`'s transition list (`CLAUDE.md` rule). Mostly
free once the P0 primitives own it.

### P1.2 — One radius scale — 6 → 3 (+ pill) · S
In use: `rounded-[3px]` (heatmap), `rounded-md` 6 (day cells), `rounded-lg` 8
(~everything), `rounded-xl` 12 (bottom-nav items), `rounded-2xl` 16 (cards),
`rounded-none` (ThemePicker).
**Target tokens:** `--radius-sm: 10px` (controls, inputs, chips, day cells,
list rows), `--radius-lg: 16px` (cards, sheets), `--radius-pill: 9999px` (dots).
Heatmap `3px` stays a literal. Retire `rounded-none`, `md`, `xl`.

### P1.3 — Type ramp — decide and enforce · M
The "one type size" claim (`app/globals.css:51-59`) is contradicted by 5 sizes,
and the most common override — `text-sm` 0.875rem — is *larger* than the 0.85rem
body it's meant to de-emphasize; only colour makes it read as secondary.
`text-sm` in ~10 files; `text-lg` `PRList.tsx:65`; `text-2xl` `StatsPanel.tsx:27`
+ `MonthDropdown.tsx:57`; `font-bold` `DayCell.tsx`.
**Target — 3 roles:** `text-display` 1.375rem/600 (stat numbers, phone month
title), `text-body` 0.8125rem/600, `text-caption` 0.75rem/600 (every current
`text-sm`). No `font-bold` — use colour + position. `tracking-wide` + `uppercase`
stays only on caption labels. Rewrite the `globals.css` comment honestly.

### P1.4 — Ship one theme + custom accent · M
Keep `zenwritten` (already tuned) and the custom-accent hex field. Delete the
other 9 presets (`lib/theme.ts:45-180`) and the preset list + swatch row
(`ThemePicker.tsx:92-131`). Removes ~140 lines and 9 contrast surfaces the code
comments show were already hand-patched to pass AA. The theme sheet becomes
"accent + data export." → iOS: one asset-catalog colour set to validate.
*(`/theme` keeps rendering all presets from `THEME_PRESETS` as documentation —
update it when the table shrinks.)*

### P1.5 — Remove `.glow` · S
Delete `app/globals.css:127-129`; strip `glow` from `DayCardContent.tsx:59`,
`MonthDropdown.tsx:61`, `Sidebar.tsx:19`, `app/theme/page.tsx` header. Accent
colour alone carries the emphasis.

### P1.6 — Kill the terminal chrome text · S
Remove `> ` prefixes (`FormHeader` `DayCardContent.tsx:18`, `Sidebar` wordmark
`:18`, `ThemePicker` header `:79`). Replace `2026/sep` with "September 2026":
delete `monthPath()` (`lib/dates.ts:86`) and the `path` variant of
`MonthDropdown`; render the `title` style on desktop too. Replace the `~`
zero-count glyph (`MonthDropdown.tsx:109`) with `0` or nothing. Decide on the
`:)` calendar button (`Calendar.tsx`) → real icon (`Palette` / `Settings`) or
fold into `<IconButton>`.

### P1.7 — One "add PR" pattern · M
Four forms today: always-expanded inline `PRForm` (`DayForm.tsx:99-106`), the
`PRIMARY` "add"/"save" button, `+ add pr` (`PRList.tsx:38-42`), bare `+`
(`PRList.tsx:61-68`).
**Target.** A single **Primary** "Add PR" button that opens the PR form inside
the card, used everywhere. Drop the always-expanded inline form and the
per-group `+`.

### P1.8 — One dismiss pattern · S
Five forms today: `close` (`.link`, FormHeader), `[ esc ]` (ThemePicker), `done`
(GHOST, PRForm), `X` icon (DayForm rows), scrim-tap.
**Target.** A single top-right close control — icon + `aria-label`, ≥44px,
`PRESSABLE` — in every sheet/card. Keep scrim-tap as a secondary path on modals.

### P1.9 — `<IconButton>` primitive · S
Ad hoc today: attached-PR `X` (`DayForm.tsx:86-93`, bare, no `PRESSABLE`), the
`:)` button (`Calendar.tsx`, `bg-surface` tile), the per-group `+`.
**Target.** `<IconButton icon label size variant>` in
`components/ui/IconButton.tsx`; always `PRESSABLE` + `FOCUS_RING` + `aria-label`
+ ≥44px hit area (see P1.10). Standardize on 2 icon sizes (P1.12).

### P1.10 — Every control ≥ 44×44 hit area · S
Sub-44px: `DayForm` `X` (14px, no padding), `PRList` group `+`, `.link` actions,
`[ esc ]`, `+ add pr` (`py-2` ≈ 34px). Add `min-h-11` or `-m-2 p-2` so the touch
area exceeds the glyph. Apple HIG minimum is 44pt — a store-review blocker class.

### P1.11 — `<OptionGroup>` — one "pick from a list" pattern · M
Four independent implementations of "row/tile is selected": split tiles
(`DayForm.tsx:36-55`, bordered, `aria-pressed`, no `PRESSABLE`), bottom nav
(`BottomNav.tsx:30-45`), sidebar nav (`Sidebar.tsx:28-42`, `ring-1`), dropdown +
preset rows (`MonthDropdown.tsx:87-111`, `ThemePicker.tsx:96-131`).
**Target.** `<OptionGroup>` + `<Option selected>` in
`components/ui/OptionGroup.tsx`, `layout="row" | "grid" | "list"`, `marker` slot.
One active style (`bg-fg/10 text-fg` — already consistent, name it), one hover
(`hover:bg-fg/5`), `PRESSABLE` + `FOCUS_RING` on all. `BottomNav` and the sidebar
nav become thin wrappers.

### P1.12 — Icon sizes 4 → 2 · S
14 (`X` `DayForm.tsx:92`), 16 (chevrons + `Dot`, many), 18 (`MonthDropdown`
title chevrons), 22 (`BottomNav.tsx:43`).
**Target.** `--icon-sm: 16px` (inline / in-control), `--icon-lg: 22px`
(standalone nav). Drop 14 and 18. Expose as `<Icon size>` on `<IconButton>`.

### P1.13 — `<Chip>` — kill the `Calendar.tsx` private `HEADER_CHIP` const · S
`HEADER_CHIP` (`Calendar.tsx:39-40`) does double duty as static year label and
interactive `TODAY` button; `:)` is a hand-rolled near-variant.
**Target.** `<Chip>` (static) in `components/ui/Chip.tsx`; interactive `TODAY` /
`:)` come from `<Button variant="quiet" size="sm">` (P0.6). Delete the const.

### P1.14 — Rebuild `ThemePicker` on the new primitives · M
It never left the pure-terminal aesthetic: `rounded-none` fields, square
swatches (`ThemePicker.tsx:120-125,146-149`), `[ bracket ]` buttons, `border`
(not dotted) rows. The most visible remaining inconsistency.
**Target.** Rebuild on `<Field>` (P0.5), `<Button>` (P0.6), `<OptionGroup>`
(P1.11), a shared `<Swatch>` (reference impl in `app/theme/parts.tsx`). No
user-facing behaviour change. This is the payoff milestone — the last
terminal-era screen joins the system.

### P1.15 — Consolidate the stats + card rendering · M
`StatsView`'s fill branch (`DayCardContent.tsx:74-96`) reimplements
`StatsPanel`'s composition inline with different spacing — two implementations
that will drift. `CurrentCard` fill vs non-fill (`CurrentCard.tsx:146-168` vs
`171-195`) is near-duplicate crossfade markup. `MobileDock` / `RightRail` are
~5-line wrappers over `CurrentCard`.
**Target.** One `<Stats layout="row" | "column">`; both dock and rail render it.
One `<CurrentCard placement>` folding the fill / non-fill duplication.

### P1.16 — Fix the calendar cell stretch + tile clipping · M
Cells stretch vertically to fill leftover height (`grid-rows-1 flex-1` +
`h-full`, `Calendar.tsx:64-69`) — a sparse month shows tall empty columns with
the date pinned to the top, reads as broken. Phone stats tiles (`StatTiles` row
layout) overflow the viewport at ~390px; the second tile is clipped.
**Target.** Cap week-row height (fixed `aspect-` / `min-h` on cells). Let the
phone tiles wrap or shrink below ~360px.
*(Overlaps the in-flight calendar rebuild in the working tree — coordinate.)*

### P1.17 — Normalize casing + the label primitive · S
"Today" is spelled three ways (`today` NavButton / `TODAY` chip / `Today` stats
heading). Pick one. Make `text-caption tracking-wide uppercase` (with the P0.1
contrast fix) the single section-label class in `lib/styles.ts`, used by
`ThemePicker` too (`DayForm.tsx:18`, `DayCardContent.tsx:66`, `StatsPanel.tsx:23`,
`YearHeatmap.tsx:97`, `ThemePicker.tsx:92,133,174`).

### P1.18 — `<Weight>` rendered two ways · S
`PRList.tsx:18-25` has a `Weight` component; `DayForm.tsx:79-82` re-implements it
inline with `text-accent` instead of `text-logged`.
**Target.** One `<Weight value muted?>` in `components/ui/Weight.tsx`; name the
colour role (resolve against P2.1).

### P1.19 — Stale reduced-motion selectors · S
`app/globals.css:108-110` targets `.snap-y` but the calendar scroller is
`.snap-x` (`Calendar.tsx`). `app/globals.css:112-116` targets a
`[data-month-key]` crossfade that no longer exists. Shimmer is `500ms` in CSS
(`globals.css:230`) vs `SHIMMER_MS = 550` in JS (`YearHeatmap.tsx:18`).
**Target.** Fix the class name, delete the dead rule, make one shimmer duration
import the other.

---

## P2 — cleanup, dead code, deferred taste calls

### P2.1 — `--logged` never diverges from `--accent` · S
All 10 presets set `logged === accent`, and `resolveTheme` forces it for a
custom accent (`lib/theme.ts:207-214`). A seam for "colour by split" never taken.
**Target.** Delete `--logged`, use `--accent` at the ~4 call sites
(`YearHeatmap.tsx:54,86`, `DayCell.tsx`, `PRList.tsx:20`) — *or* commit and give
it a distinct default. Note the decision in the `/theme` colour section.

### P2.2 — Remove the heatmap shimmer easter egg · S
`app/globals.css:219-239` + `YearHeatmap.tsx` ripple state, `onGridClick`,
stagger math, keyed remounts. ~40 lines for a one-time effect. Fails "simple."

### P2.3 — Replace the `get strong` footer · S
`Sidebar.tsx:46` — flavour text in a permanent slot. Replace with app version +
an export shortcut, or delete the row.

### P2.4 — One structural stroke · S
Move `Sidebar` rails and `PRList` separators to a solid `border-border` hairline;
keep dotted only for the `.link` underline. Drop the lone `border-dashed` on
future-trained cells (`DayCell.tsx`) — use a hollow dot / lower opacity.

### P2.5 — Settle the font question · M
Keep JetBrains Mono for the calendar grid and all numerals (alignment earns it);
move nav, labels, prose to a system sans (`-apple-system` stack — most
native-feeling for the iOS webview phase). Its own change, with before/afters.

### P2.6 — Loading state · S
Replace the bare `loading…` string (`app/page.tsx`) with a static
calendar-grid skeleton — kills the mount flash and the layout shift.

### P2.7 — Friendly `DayCell` `aria-label` · S
Announces the raw key `2026-09-06` instead of a spoken date (`DayCell.tsx`).

### P2.8 — `lib/animate.ts` `tween()` — unused · S
Eased rAF tween, no importers. Delete, or adopt for the `CARD` transition
(`CurrentCard.tsx:36-37`). Default: delete; re-add when a JS animation lands.
`easeOutCubic` ≈ the proposed `ease-out` cubic-bezier if kept.

### P2.9 — `components/dayStatus.ts` — unused · S
Exports `statusTextClass(isFuture)`, no importers (`DayCell` inlines the
mapping). Delete, or fold the warm/cool mapping into `lib/tokens.ts` and delete
the file. *Re-check — the working tree may have just removed the last import.*

### P2.10 — `.tip` tooltip CSS — no consumer · S
`app/globals.css:158-168`, no `.tip` element anywhere. Delete, or build the
`<Tooltip>` it's waiting for (day-cell split on desktop hover). Default: delete.

### P2.11 — Unused `lib` exports · S
`git grep` each, then delete: `lib/dates.ts` `addMonths`, `monthLabel`,
`isMonthInRange`; `lib/workouts.ts` `isTrained`, `getTrainedDay`, `setSplit`,
`setNotes`; `lib/storage.ts` `remove`; `lib/types.ts` `isSplit`.

### P2.12 — `splits` and `gallery` are placeholder views · M
`VIEWS = ["calendar","prs","splits","gallery"]` (`lib/views.ts:2`) ships two
views that render `"<name> — not built yet"` (`app/page.tsx`), taking 2 of 4 nav
slots. Decide with product: build them, or cut from `VIEWS` until real (a 2-item
nav is honest). Cutting also simplifies the `view` state machine. Cut = S,
build = L.

### P2.13 — Verify `lucide-react@^1.41.0` · S
`package.json` pins `^1.41.0`; the library's public release line is `0.x`.
Confirm against the registry; pin an exact version (drop `^`) once settled —
icon-set churn is a visual-regression vector.

### P2.14 — Layout primitives → named tokens · S
Magic widths inline: sidebar `w-[15rem]`, right rail `w-[23rem]`, theme sheet
`lg:w-[24rem]`, dropdown `w-48`/`max-h-80`, autocomplete `max-h-48`, form scroll
`max-h-[58dvh]`.
**Target.** `lib/layout.ts` or CSS vars — `--rail-left`, `--rail-right`,
`--sheet-w`, `--menu-w`, `--menu-max-h`. Makes "does this port to iOS" a
one-file question.

---

## Proposed token scale

Land as `lib/tokens.ts` + CSS custom properties in `app/globals.css`. Derived
from what's already in the code, trimmed to the minimum that still expresses
every distinction the app actually makes.

### Spacing (keep Tailwind step names; use only these)

| token | value | role |
| --- | --- | --- |
| `space-1` | 4px | icon ↔ label, dot gaps |
| `space-2` | 8px | inside controls; field-stack gap |
| `space-3` | 12px | row padding; between controls |
| `space-4` | 16px | card / stage interior |
| `space-5` | 24px | between form sections; heading → content |
| `space-6` | 40px | between top-level page sections |

Drop `0.5 / 1.5 / 2.5` half-steps and the `gap-6`/`mt-5` mix — map each to the
nearest token.

### Radius

| token | value | role |
| --- | --- | --- |
| `radius-sm` | 10px | inputs, buttons, chips, day cells, list rows |
| `radius-lg` | 16px | cards, the floating `CARD`, stat tiles, sheets |
| `radius-pill` | 9999px | status dots |

(`3px` heatmap cell stays a literal; `rounded-none` / `md` / `xl` retired.)

### Type ramp

| role | size / weight / line-height | replaces |
| --- | --- | --- |
| `text-display` | 1.375rem / 600 / 1.2 | `text-2xl`, `text-lg` |
| `text-body` | 0.8125rem / 600 / 1.5 | the `0.85rem` body |
| `text-caption` | 0.75rem / 600 / 1.4 (+ `tracking-wide` `uppercase` for labels) | every `text-sm` |

No `font-bold` (700). Tabular numerals on. `.glow` retired (P1.5).
**Inputs override to 16px regardless** (P0.2).

### Elevation

| token | value | role |
| --- | --- | --- |
| `surface-0` | `--bg` | page ground |
| `surface-1` | `--surface` | cards, chips, dock, inputs-on-dark |
| `shadow-menu` | Tailwind `shadow-lg` | floating menus only (`MonthDropdown`) |

No other shadows. Border + `surface-1` is the elevation language. `.glow-box`
retired unless the in-flight "today cell" work adopts it deliberately.

### Motion

| token | value | role |
| --- | --- | --- |
| `dur-press` | 100ms | `PRESSABLE` (scale + brightness) |
| `dur-fade` | 150ms | colour / opacity hovers |
| `dur-move` | 300ms | the `CARD` state slide/fade |
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | everything that moves |

All no-ops under `prefers-reduced-motion: reduce` except the `PRESSABLE`
brightness dim (feedback, not decoration). Nothing loops. No easter eggs.

---

## Target system (from `docs/design-audit.md`)

| Axis | Today | Target |
|------|-------|--------|
| Button variants | ~8 | **3** — Primary, Quiet, Link |
| Radii | 6 | **3** — 10px control, 16px container, pill |
| Spacing | Tailwind + many half-steps | `1 / 2 / 3 / 4 / 6` (+ `space-5` 24px), drop `0.5 / 1.5 / 2.5` |
| Type sizes | 4 (no step between base & "small") | **3** — display / body / caption |
| Font weights | 600 + one bold | **1** — 600 |
| Colour tokens | 8 (+ ~20 opacity derivatives) | **6** roles + **1** data hue (`scheduled`); drop `logged` |
| Themes | 10 presets + custom accent | **1** tuned theme + custom accent |
| Focus ring | `ring-2` / `ring-1` / none | `ring-2 ring-inset ring-accent` everywhere |
| Glow / scanlines / blink | glow ×3, scanlines (dead), blink ×1 | **none** |
| Motion | 9 effects incl. 1 infinite + 1 easter egg | `PRESSABLE` + one 200–300ms state transition + native scroll-snap |
| Press affordance | `PRESSABLE` on ~5/19 controls | **all** controls |

---

## Suggested sequencing

1. **P0.4** (focus ring) + **P0.2** (input size) + **P0.10** (`aria-current`) —
   one-liners; unblock the rest.
2. **P0.5 `<Field>`**, then rebuild `PRForm` on it.
3. **P0.6 `<Button>`** + **P1.9 `<IconButton>`** + **P0.7 `<TextAction>`** — the
   control trilogy. Migrate `PRForm`, `PRList`, `NavButton`, `DayForm` icon.
   Fixes P1.1 (`PRESSABLE` coverage), P1.8 (dismiss), P1.10 (hit areas) as they go.
4. **P1.11 `<OptionGroup>`** — `BottomNav`, sidebar nav, split tiles, dropdown
   rows collapse onto it.
5. **P1.3** type ramp + **P1.2** radius + **P1.12** icons + **P0.1** contrast —
   the token trims, now that primitives own the values.
6. **P1.4** ship one theme + **P1.5** `.glow` + **P1.6** chrome text — the visual
   subtraction.
7. **P1.14** rebuild `ThemePicker` — the payoff milestone.
8. **P1.15** stats/card consolidation, **P1.16** calendar layout (coordinate with
   the in-flight rebuild), **P1.19** motion selectors.
9. The P0.8 / P0.9 deletions and the P2 cleanup in any order.
