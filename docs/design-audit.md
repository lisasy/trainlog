# trainlog — design-system audit

Principal design-engineer review of the taste layer: what's inconsistent, what's
excess, and a prioritized cut-list. Scope is the visual + interaction language.
Lucy owns the `/theme` route and the code refactor; this doc feeds a
consolidation pass, so cut-list items are written to stand alone.

Reviewed at ~390px and 1440px against the running app (`npm run dev`), plus a
full read of `CLAUDE.md`, `app/globals.css`, `lib/theme.ts`, `lib/styles.ts`,
and every file in `components/`.

**One-line verdict:** the bones are good — the token model is clean, the
calendar grid is confident, a few primitives (the uppercase section label, the
`Dot` selection marker, the `bg-fg/10` active state) are already real system
pieces worth protecting. But the surface is carrying two aesthetics at once: a
terminal costume (glow, blink, `>` prompts, `[ esc ]`, 10 CRT themes, mono
everywhere) layered under a genuinely nice modern app. The costume is where all
the inconsistency and most of the accessibility debt lives. Cutting it is
subtraction, not redesign.

---

## 1. Inventory of the current visual + interaction language

### 1a. Button / control treatments actually in use

There is no button component. Every control is hand-assembled from class
strings. Distinct treatments found (≈18 interactive surfaces, ≥8 visually
distinct styles):

| # | Treatment | Where | `PRESSABLE`? | Focus ring |
|---|-----------|-------|--------------|------------|
| 1 | **NavButton filled** — `h-9 rounded-lg px-3 bg-surface text-dim hover:bg-border hover:text-accent`; `emphasis` → `bg-accent text-bg` | desktop header month nav + `today` (`NavButton.tsx:21-29`) | yes | ring-2 |
| 2 | **DayForm split tiles** — `rounded-lg border px-1 py-2.5 text-sm uppercase`, active `border-accent text-accent` / inactive `border-border text-dim` | day editor (`DayForm.tsx:44-50`) | **no** (`transition-colors`) | ring-2 |
| 3 | **PRForm PRIMARY** — `rounded-lg border border-accent px-4 py-2 text-accent hover:bg-accent hover:text-bg` | PR add/save (`PRForm.tsx:39-40`) | **no** | ring-2 |
| 4 | **PRForm GHOST** — `rounded-lg border border-transparent px-4 py-2 text-dim hover:text-accent`, label "done" | PR form cancel (`PRForm.tsx:42-43`) | **no** | ring-2 |
| 5 | **`[ bracket ]` text buttons** — `border border-border px-2 py-1.5` (corners NOT rounded), hover `border-accent`; plus borderless `[ esc ]` | ThemePicker `[ esc ] [ apply ] [ reset ] [ export ] [ import ]` (`ThemePicker.tsx:82-88, 152-193`) | **no** | none |
| 6 | **`.link` dotted-underline text action** — `.link` + `text-dim hover:text-accent` | `close`, `theme`, `clear this day`, `delete this pr`, `clear date` (`DayCardContent.tsx:11-12`, `globals.css:175-186`) | **no** | text-color only |
| 7 | **PRList `+ add pr`** — `rounded-lg border border-border px-3 py-2 text-dim hover:border-accent hover:text-accent` | PR ledger top (`PRList.tsx:38-43`) | **no** | ring-2 |
| 8 | **PRList group `+`** — bare `text-lg leading-none text-dim hover:text-accent` | per-exercise add (`PRList.tsx:61-68`) | **no** | text-color only |
| 9 | **ThemePicker preset row** — `flex w-full px-2 py-2`, active `bg-fg/10 text-fg` / inactive `hover:bg-fg/5`, + `Dot` marker + 4 bordered swatches | theme list (`ThemePicker.tsx:98-127`) | **no** | none |
| 10 | **Bare icon buttons** — DayForm remove `X` (`size=14`, no padding), Calendar `:)` theme trigger (`h-9 w-9 rounded-lg bg-surface`) | `DayForm.tsx:86-93`, `Calendar.tsx:179-190` | mixed (`:)` yes, `X` no) | mixed |
| 11 | **HEADER_CHIP** — `h-8 rounded-lg bg-surface px-2.5 text-dim`; used for both the non-interactive "2026" year label AND the interactive "TODAY" button | `Calendar.tsx:39-40, 178, 201-212` | TODAY yes, year n/a | ring-2 on TODAY |
| 12 | **MonthDropdown `title`** — `text-2xl text-fg` + chevron | phone calendar heading (`MonthDropdown.tsx:55-60`) | yes | ring-2 |
| 13 | **MonthDropdown `path`** — `text-accent glow` + chevron, `cursor-pointer` only | desktop header `2026/sep` (`MonthDropdown.tsx:61`) | **no** | **`outline-none`, no replacement** |
| 14 | **Sidebar nav row** — `px-2 py-0.5 hover:bg-fg/5`, active `bg-fg/10` | desktop views list (`Sidebar.tsx:29-42`) | **no** | ring-**1** |
| 15 | **BottomNav tab** — `rounded-xl px-4 py-3` icon, active `bg-fg/10` | phone tab bar (`BottomNav.tsx:33-44`) | yes | ring-2 |
| 16 | **DayCell** — `rounded-md p-1.5`, layered state chrome | calendar grid (`DayCell.tsx:52-64`) | yes | ring-2 |
| 17 | **MonthDropdown listbox option** — `px-3 py-1 hover:bg-fg/5` | month picker popover (`MonthDropdown.tsx:97-100`) | **no** | none |
| 18 | **PRForm autocomplete suggestion** — `px-3 py-2 hover:bg-fg/10` | exercise typeahead (`PRForm.tsx:128`) | **no** | none |
| 19 | **PRList entry row** — full-width `px-1 py-1.5 border-b border-dotted hover:bg-fg/5` | ledger rows (`PRList.tsx:81-85`) | **no** | none |

**`PRESSABLE`, the documented house contract (`CLAUDE.md`), is applied to 5 of
~19 interactive surfaces** (`DayCell`, `NavButton`, `BottomNav`, `MonthDropdown`
title variant, the two `Calendar` header chips). Everything in a form, a
popover, the ledger, the sidebar, and the theme sheet is missing it.

Hover-fill tokens in play: `bg-fg/5`, `bg-fg/10`, `bg-fg/15`, `bg-surface`,
`bg-surface/40`, `bg-surface/60`, `bg-border`, `bg-accent` — 8 different hover
fills for "this is hoverable."

Focus-ring treatments: `ring-2 ring-inset ring-accent` (most), `ring-1`
(Sidebar), text-color shift only (`.link`, PRList `+`), and **nothing**
(MonthDropdown path variant, ThemePicker rows, listbox options, suggestions,
DayForm `X`).

### 1b. Radii

Six distinct radii: `rounded-none` (ThemePicker fields, `ThemePicker.tsx:61`),
`rounded-[3px]` (heatmap cells, `YearHeatmap.tsx:86`), `rounded-md` = 6px
(DayCell, `DayCell.tsx:53`), `rounded-lg` = 8px (10 places — the de-facto
default), `rounded-xl` = 12px (BottomNav tab, `BottomNav.tsx:37`), `rounded-2xl`
= 16px (CurrentCard, StatTile, BottomNav container). The BottomNav container is
`2xl` while its own tabs are `xl`. Day cells are `md` while every other control
is `lg`.

### 1c. Typography — the "one font size" claim vs reality

`globals.css:51-76` states "One type size for the entire app… hierarchy comes
from color and position, never from font-size or weight." Actual sizes rendered:

- base `body` = **0.85rem / 13.6px**, `font-weight: 600`, `letter-spacing: 0`
- `text-sm` = **0.875rem / 14px** — used **28 times** (every section label, caption,
  meta line, "lbs", note text). Note this is **larger** than base, so the
  "small print" is not small; it reads flat.
- `text-lg` = 1.125rem / 18px — **1 use** (PRList group `+`, `PRList.tsx:65`)
- `text-2xl` = 1.5rem / 24px — **2 uses** (MonthDropdown title `MonthDropdown.tsx:57`,
  StatTile value `StatsPanel.tsx:27`)

So the real scale is 13.6 / 14 / 18 / 24 with no deliberate step between the
first two. Weight is genuinely near-single: `body` 600 everywhere, one
`font-bold` (DayCell day number, `DayCell.tsx:66`).

### 1d. Spacing rhythm

Mostly on the Tailwind scale (good), but wide and full of half-steps: gaps of
`1, 1.5, 2, 3, 6`; margins `mt-0.5, mt-1, mt-2, mt-3, mt-4, mt-5`; padding
`p-1.5, p-2, p-2.5, p-3, p-4`, `py-2.5`, `py-0.5`. Card padding is inconsistent
for the same role: `p-4` (`CurrentCard.tsx:37`), `p-3` (`StatsPanel.tsx:21`
tile, `RightRail.tsx:32`), `p-2` (`BottomNav.tsx:24`). Stats internal gap is
`gap-3` in `StatsPanel.tsx:74` but `gap-6` in the parallel `StatsView` fill
branch (`DayCardContent.tsx:76`). Heatmap gap is `gap-[2px]` non-fill /
`gap-[3px]` fill, wrapper `gap-2` / `gap-1` (`YearHeatmap.tsx:57, 101`).

### 1e. Borders

- **solid** `border-border` — inputs, popover, DayCell today/cursor, swatches
- **dotted** `border-dotted border-border` — Sidebar rails (`Sidebar.tsx:14,17,45`),
  PRList section rule + row separators (`PRList.tsx:54,84`), ThemePicker header
  (`ThemePicker.tsx:77`), and the `.link` underline (`globals.css:177`)
- **dashed** `border-dashed border-fg/25` — future-trained day cells only
  (`DayCell.tsx:61`)

Dotted is doing three unrelated jobs (structural rule, list separator, text-link
affordance); dashed appears exactly once, semantically close to dotted
("provisional").

### 1f. Color tokens

Eight role tokens (`bg, surface, fg, accent, dim, border, logged, scheduled`,
`globals.css:33-42`). Observations:

- **`--logged` is always identical to `--accent`.** Every preset sets
  `logged: <same value as accent>` (`lib/theme.ts`), and a custom accent forces
  `logged = accent` too (`theme.ts:213`). It is a redundant token.
- **`--scheduled`** is the only genuinely independent hue, and it renders on
  roughly two elements: the future-trained dot (`DayCell.tsx:72`) and future
  heatmap cells (`YearHeatmap.tsx:54`).
- The 8 tokens spawn ~20 ad-hoc derived values via opacity: `bg/40`, `bg/60`,
  `surface/40`, `surface/60`, `surface/80`, `fg/5`, `fg/10`, `fg/15`, `fg/25`,
  `fg/60`, `accent/70`, `accent/85`, `dim/30`, `dim/40`, `dim/50`.
- `--dim` was hand-lifted per preset to clear AA **on `--bg` only** (comments in
  `globals.css:17-21` and throughout `theme.ts`). It is still used as text on
  `--surface`, where it fails — see §3.

### 1g. Motion inventory

| Effect | Duration | Source |
|--------|----------|--------|
| `PRESSABLE` scale 0.98 + brightness 90% | 100ms | `lib/styles.ts` |
| `CARD` state crossfade (translate + opacity) | 300ms | `CurrentCard.tsx:37` |
| `[data-month-key]` active/inactive opacity | (transition) | `Calendar.tsx`, `globals.css:114` |
| programmatic month scroll (`behavior:"smooth"`) | ~500ms suppress | `Calendar.tsx:114-127` |
| scroll-snap month paging | native | `Calendar.tsx:221` |
| `.cursor-block` blink | 1.1s **infinite** | `globals.css:79-92` |
| `.tip` tooltip fade | 90ms | `globals.css:159-168` |
| `.link` underline-color | (transition) | `globals.css:175-186` |
| **heatmap-shimmer ripple** (easter egg) | 500ms + staggered, ~1.7s total | `globals.css:219-239`, `YearHeatmap.tsx:26-92` |

`prefers-reduced-motion` is handled well (`globals.css:94-124`). `tween()` in
`lib/animate.ts` is **dead code** — no importer.

---

## 2. Terminal-aesthetic holdovers — keep / soften / cut

| Holdover | Location | Verdict | Rationale |
|----------|----------|---------|-----------|
| **CRT `.scanlines`** overlay | `globals.css:136-153` | **CUT (dead)** | Class is defined and never applied to any element. Pure scaffolding. |
| **`.glow-box`** phosphor box-shadow | `globals.css:131-133` | **CUT (dead)** | Defined, never referenced. |
| **`.glow`** phosphor text-shadow | `globals.css:127-129`; used in `DayCardContent.tsx:59` ("Today"), `MonthDropdown.tsx:61` (`2026/sep`), `Sidebar.tsx:19` (wordmark) | **CUT** | The single loudest "this is a terminal" tell. Blur on text hurts legibility for zero information gain. The accent color alone is enough emphasis. |
| **Blinking `.cursor-block`** | `globals.css:79-92`; `Sidebar.tsx:20-23` | **CUT** | A permanently animating element fights "calm," pulls the eye off content, and only stops under reduced-motion. Nothing about a training log needs a blinking cursor. |
| **`> ` prompt prefixes** | `DayCardContent.tsx:18` (FormHeader), `Sidebar.tsx:18` (wordmark), `ThemePicker.tsx:79` (header) | **CUT** | Decorative punctuation standing in for hierarchy that weight/size should carry. |
| **`[ esc ]` / `[ export ]` bracket buttons** | `ThemePicker.tsx:82-88, 152-193` | **CUT** | The `[ ]` glyphs read as literal text, not affordances; square un-rounded borders clash with the rest of the app; no `PRESSABLE`, no focus ring. Replace with standard buttons. |
| **`:)` face button** (theme trigger) | `Calendar.tsx:179-190` | **CUT** | Not recognizable as a control or as "theme." Use a real icon — `lucide-react` is already a dependency (`Palette` / `Settings`). |
| **`TODAY` chip** (uppercase) | `Calendar.tsx:201-212` | **SOFTEN** | Fine as a button; just reconcile casing — the app says `today` / `TODAY` / `Today` for the same concept (§3). |
| **`~` zero-count glyph** | `MonthDropdown.tsx:109` | **SOFTEN** | Shell "empty" shorthand. Show nothing, or `0`. |
| **`2026/sep` shell path** | `MonthDropdown.tsx:64`, `monthPath()` in `dates.ts:86` | **CUT** | Desktop shows a filesystem path; phone already shows "September". Standardize on "September 2026". |
| **10 CRT theme presets** | `lib/theme.ts:29-180`, `ThemePicker.tsx:92-131` | **CUT to 1** | `zenwritten`, `amber`, `phosphor`, `green phosphor`… `matrix`. This is the biggest "toy" signal and the largest iOS liability: each preset is a contrast surface that must be re-validated (the code comments show most already failed AA and were hand-patched). Ship one tuned dark theme; keep the custom-accent hex field for expression. |
| **Year-heatmap shimmer ripple** | `globals.css:219-239`, `YearHeatmap.tsx` ripple state + stagger math | **CUT** | ~40 lines + a keyframe for a delight that fires once and is dead weight forever. Fails "simple." |
| **`get strong` footer** | `Sidebar.tsx:46` | **CUT / REPLACE** | Flavor text in a permanent slot. Replace with app version + an export shortcut, or remove. |
| **Monospace everywhere** | `body` in `globals.css:63`, `layout.tsx` (JetBrains Mono) | **SOFTEN (deliberate, later)** | Mono earns its place in the calendar grid and all numerals (alignment). It does not earn it for nav, labels, and prose. This is the deepest holdover — plan it, don't rush it (P2). |
| **All-lowercase UI copy** ("log", "pr", "add pr", "close", "sun mon tue") | throughout | **SOFTEN (taste)** | Reads as terminal voice. Sentence-case labels unless lowercase is a deliberate, documented brand choice. |
| **`.link` dotted underline** | `globals.css:175-186` | **KEEP (narrowed)** | The one dotted use that's pulling weight — a quiet text-link affordance. Keep it *only* here; move structural rules to a solid hairline. |

---

## 3. Inconsistencies that break the system

**Same intent, different treatment:**

1. **"Add a PR" has four visual forms:** an always-expanded inline `PRForm`
   (`DayForm.tsx:99-106`), a bordered-accent PRIMARY button labeled "add"/"save"
   (`PRForm.tsx:188`), a bordered `+ add pr` (`PRList.tsx:38-43`), and a bare
   `+` glyph (`PRList.tsx:61-68`).
2. **"Dismiss" has five forms:** `close` (`.link`, FormHeader), `[ esc ]`
   (ThemePicker), `done` (GHOST, PRForm), `X` icon (DayForm rows), and
   scrim-tap (ThemePicker overlay). Different word, different style, different
   position each time.
3. **"Today / now" is spelled three ways:** `today` (NavButton, lowercase,
   filled), `TODAY` (chip, uppercase), `Today` (stats heading, title-case,
   accent + glow).
4. **Month label is rendered three ways:** `2026/sep` (`monthPath`, desktop
   header), `September` (`monthFullName`, phone), `aug 2026` (`monthNameYear`,
   dropdown list). A fourth formatter, `monthLabel()` → `"2026 / aug"`
   (`dates.ts:71`), is **dead code**.
5. **Section-label primitive forks:** `text-sm tracking-wide text-dim uppercase`
   is a real, repeated primitive (`DayForm.tsx:18`, `DayCardContent.tsx:66`,
   `StatsPanel.tsx:23`, `YearHeatmap.tsx:97`) — good. But ThemePicker's section
   labels are `text-sm text-dim` with no tracking/uppercase
   (`ThemePicker.tsx:92,133,174`), so the theme sheet looks like a different
   app.
6. **Focus rings:** `ring-2` almost everywhere, `ring-1` in Sidebar
   (`Sidebar.tsx:36`), **none** on the desktop month switcher
   (`MonthDropdown.tsx:61` sets `outline-none` with no replacement — keyboard
   focus is invisible on a primary navigation control).
7. **Active-item style** (`bg-fg/10 text-fg`) *is* consistent across Sidebar,
   BottomNav, MonthDropdown list, and ThemePicker presets — name it and keep it.
8. **`aria-current`** value differs: `"page"` in `BottomNav.tsx:38`, `"true"` in
   `Sidebar.tsx:33` for the identical purpose.

**Spacing / scale drift:** card padding `p-4` vs `p-3` vs `p-2` for the same
"card" role (§1d); stats gap `gap-3` vs `gap-6`; radii `md` vs `lg` vs `xl` vs
`2xl` for peer surfaces; two heatmap gap scales.

**Redundant / overlapping components:**

- **`StatsView` fill-branch (`DayCardContent.tsx:74-96`) reimplements
  `StatsPanel`'s composition inline** instead of reusing it. The phone dock
  (non-fill) renders `StatsPanel`; the desktop rail (fill) hand-rolls
  heading + `StatTiles` + `YearHeatmap` with different spacing. The "same"
  stats block has two implementations that will drift.
- **`CurrentCard` fill vs non-fill (`CurrentCard.tsx:146-168` vs `171-195`)**
  are two near-duplicate copies of the stats/form crossfade markup.
- **`MobileDock` and `RightRail`** are each ~5-line wrappers around
  `CurrentCard` with different props. Could be one `<CurrentCard placement>`.
- **`Sidebar` (desktop nav) and `BottomNav` (phone nav)** render the same
  `VIEWS` list with divergent styling, `aria-current` values, and ring widths.

**Accessibility gaps:**

- **Contrast — `text-dim` on `--surface`.** `--dim` (`#898180`) is ~3.7:1 on
  `--surface` (`#242424`) — **fails WCAG AA (4.5:1)**. It was only ever tuned
  for `--bg` (`#191919`, ~4.6:1). Affected: `HEADER_CHIP` "2026" and "TODAY"
  (`Calendar.tsx:39-40`), the FormHeader `> ` prompt (`DayCardContent.tsx:18`),
  DayForm split-tile inactive labels (`DayForm.tsx:48`), and any `text-dim`
  inside the `bg-surface` card.
- **Contrast — dimmed disabled controls.** `disabled:text-dim/30`
  (`NavButton.tsx:28`) on the desktop month arrows and `disabled:text-dim/40`
  (`PRForm.tsx:40`) land near 1.5:1. The month arrows are a primary control;
  disabled ≠ invisible.
- **Invisible focus** on `MonthDropdown` path variant (above).
- **Touch targets < 44px:** DayForm remove-`X` (14px icon, zero padding,
  `DayForm.tsx:86-93`), PRList group `+` (`PRList.tsx:61-68`), `.link` text
  actions, `[ esc ]`, `+ add pr` (`py-2` ≈ 34px). `BottomNav` and `DayCell` are
  fine.
- **Heatmap:** `role="img"` with an `onClick` (`YearHeatmap.tsx:104`) but no
  keyboard path; cells carry native `title` tooltips but the grid isn't
  focusable, so the per-day labels are mouse-only.
- **`aria-hidden` decorative elements** are handled correctly (the blink cursor,
  status dots, chevrons all carry `aria-hidden`). Good.
- **No focus trap / initial-focus management** when `ThemePicker` or the day
  sheet opens (Escape does work). Acceptable for a personal app today; revisit
  before the app store.
- **DayCell `aria-label`** announces the raw key `2026-09-06` rather than a
  spoken date (`DayCell.tsx:49`).

**Layout / responsive bugs seen in the running app:**

- **Calendar cells stretch vertically to fill leftover height** (`grid-rows-1
  flex-1` + `h-full`, `Calendar.tsx:68-69`). On a sparse month the trained-day
  highlight becomes a tall empty column with the date pinned to the top — reads
  as broken at both widths (visible on `06`/`08` and the `01–05` column).
- **Stats tiles clip at 390px.** In the phone dock the two `flex-1` tiles +
  `gap-2` overflow the viewport; the second tile ("PR / deadlift / 175 lbs") is
  cut off on the right (`StatsPanel.tsx` row direction + `CurrentCard` `p-4` +
  dock `px-4`).
- **The floating dock permanently occludes the bottom ~2 weeks** of the month
  grid on a real phone height (the card is opaque `bg-surface` over the lower
  calendar). The `dock-veil` mask softens it but the days are still behind the
  card.

---

## 4. Prioritized cut-list

Bias: remove. Each item is self-contained.

### P0 — broken, inaccessible, or embarrassing

**P0-1. Delete dead terminal CSS.** Remove `.scanlines` (`globals.css:136-153`)
and `.glow-box` (`globals.css:131-133`). Neither is referenced anywhere. Zero
visual change. *Simpler:* removes the CRT scaffolding so nobody re-enables it.
*iOS:* one less thing to port.

**P0-2. Fix `text-dim`-on-`surface` contrast.** `--dim` fails AA (4.5:1) on
`--surface`. Cheapest fix: stop putting muted text on surface — set
`HEADER_CHIP` (`Calendar.tsx:39-40`), the FormHeader prompt line
(`DayCardContent.tsx:15-24`), and DayForm inactive split labels
(`DayForm.tsx:48`) to `text-fg`, and let position/size carry the hierarchy.
Alternative: add a `--dim-strong` token that clears 4.5:1 on surface and use it
on cards. *Simpler:* fewer text colors. *iOS:* AA is table stakes for the store.

**P0-3. Restore focus visibility on the desktop month switcher.**
`MonthDropdown.tsx:61` (`path` variant) sets `focus-visible:outline-none` with
no replacement. Give it the same `focus-visible:ring-2 ring-inset ring-accent`
the `title` variant already uses. *iOS:* keyboard/switch-control users.

**P0-4. Bring every sub-44px control up to a 44×44 hit area.** DayForm `X`
(`DayForm.tsx:86-93`), PRList group `+` (`PRList.tsx:61-68`), `.link` actions,
`[ esc ]`, `+ add pr`. Add `min-h-11` or `-m-2 p-2` so the touch area exceeds
the glyph. *iOS:* Apple HIG minimum is 44pt; this is a review-blocker class of
issue.

**P0-5. Remove the blinking cursor.** Delete `.cursor-block`
(`globals.css:79-92`) and its element (`Sidebar.tsx:20-23`), plus its
reduced-motion override (`globals.css:95-97`). *Simpler:* one fewer infinite
animation; the wordmark stands on its own. *iOS:* looping motion next to a
title is exactly what "restrained" rules out.

**P0-6. Normalize `aria-current`.** `Sidebar.tsx:33` `"true"` → `"page"` to
match `BottomNav`.

### P1 — the simplification that defines the redesign

**P1-1. Collapse to 3 button roles.** Define in `lib/styles.ts` next to
`PRESSABLE`:
- **Primary** — `bg-accent text-bg rounded-[--radius] px-4 h-9` + `PRESSABLE` +
  ring. One primary per screen.
- **Quiet** — `bg-surface text-fg hover:bg-border rounded-[--radius] px-3 h-9`
  + `PRESSABLE` + ring.
- **Link** — `.link` text action (keep as-is).

Retire: `PRForm` `PRIMARY`/`GHOST` (`PRForm.tsx:39-43`), all `[ bracket ]`
buttons (`ThemePicker`), `+ add pr` bordered style, bare `+`, the `:)` button,
the two divergent `HEADER_CHIP` roles. *Simpler:* 8→3. *iOS:* maps 1:1 to
`.borderedProminent` / `.bordered` / `.plain`.

**P1-2. Apply `PRESSABLE` to every remaining control.** It's the documented
contract and it's on ~25% of controls. Add to: DayForm split tiles, all PR-form
buttons, PRList rows + adders, ThemePicker rows, Sidebar nav rows, MonthDropdown
options + path trigger, FormHeader close, autocomplete suggestions. Fold any
existing `transition-colors` into `PRESSABLE`'s transition list per `CLAUDE.md`.

**P1-3. One radius scale.** Two tokens: `--radius: 10px` (controls, inputs, day
cells, chips) and `--radius-lg: 16px` (cards, sheets), plus `rounded-full` for
dots. Delete `rounded-md` (`DayCell`), `rounded-xl` (`BottomNav` tab),
`rounded-[3px]` (heatmap → use `--radius` scaled or a 2px token), `rounded-none`
(`ThemePicker` fields → `--radius`). *iOS:* one `cornerRadius` constant.

**P1-4. Ship one theme.** Keep `zenwritten` (already tuned), keep the
custom-accent hex field. Delete the other 9 presets from `lib/theme.ts:45-180`
and the preset list + swatch row from `ThemePicker.tsx:92-131`. Removes ~140
lines and 9 contrast surfaces. *Simpler:* the theme sheet becomes "accent + data
export." *iOS:* one asset catalog color set to validate, not ten.

**P1-5. Remove `.glow`.** Delete `globals.css:127-129`; strip the `glow` class
from `DayCardContent.tsx:59`, `MonthDropdown.tsx:61`, `Sidebar.tsx:19`. Accent
color carries the emphasis.

**P1-6. Kill the terminal chrome text.** Remove `> ` prefixes (`FormHeader`,
`Sidebar` wordmark, `ThemePicker` header). Replace `2026/sep` with "September
2026" — delete `monthPath()` (`dates.ts:86`) and the `path` variant of
`MonthDropdown`, use the `title` rendering on desktop too. Delete dead
`monthLabel()` (`dates.ts:71`) and `tween()` (`lib/animate.ts`).

**P1-7. One "add PR" pattern.** A single **Primary** "Add PR" button that opens
the PR form inside the card, used everywhere. Remove the always-expanded inline
`PRForm` from `DayForm.tsx:99-106` (replace with the button) and the per-group
`+` from `PRList.tsx:61-68`. *Simpler:* one mental model for logging a lift.

**P1-8. One dismiss pattern.** A single top-right close control — icon +
`aria-label`, 44px, `PRESSABLE` — in every sheet/card (`FormHeader`,
`ThemePicker`, PR form). Retire `[ esc ]`, the `done` ghost button, and the
`close` text link. Keep scrim-tap as a secondary path on the modal.

**P1-9. Consolidate stats rendering.** One `<Stats layout="row" | "column">`
component; delete the inline reimplementation in `StatsView`'s fill branch
(`DayCardContent.tsx:74-96`) and have both the dock and rail render it. Same
move for `CurrentCard`'s duplicated fill / non-fill crossfade markup.

**P1-10. Fix the calendar cell stretch + tile clipping.** Cap week-row height
(or give cells a fixed `aspect-` / `min-h`) so a sparse month doesn't produce
tall empty columns (`Calendar.tsx:64-69`). Let the phone stats tiles wrap or
shrink below ~360px so the PR tile isn't clipped (`StatsPanel` / `StatTiles`
row layout).

**P1-11. Normalize casing + the label primitive.** Pick one "Today". Make
`text-sm tracking-wide uppercase text-dim` (with the P0-2 contrast fix) the
single section-label class, imported from `lib/styles.ts`, used by ThemePicker
too.

### P2 — taste / polish, defer-safe

**P2-1. Remove the heatmap shimmer easter egg** (`globals.css:219-239`,
`YearHeatmap.tsx` ripple state, `onGridClick`, stagger math, keyed remounts).
~40 lines for a one-time effect.

**P2-2. Replace `get strong` footer** (`Sidebar.tsx:46`) with app version + an
export shortcut, or delete the row.

**P2-3. One structural stroke.** Move Sidebar rails and PRList separators to a
solid `border-border` hairline; keep dotted only for the `.link` underline.
Drop the lone `border-dashed` on future-trained cells (`DayCell.tsx:61`) — use
a hollow dot / lower opacity instead.

**P2-4. Settle the font question.** Keep JetBrains Mono for the calendar grid
and all numerals; move nav, labels, and prose to a system sans
(`-apple-system` stack — also the most native-feeling for the iOS webview
phase). Do this as its own change with before/afters.

**P2-5. Real type scale.** Base is 13.6px and `text-sm` is 14px — the "small"
text isn't small. Set base to `0.875rem`, define 3 steps (e.g. 13 label / 15
body / 22 display), 2 weights (500 / 700), tabular numerals on. Update the ~28
`text-sm` sites to either the label token or nothing.

**P2-6. Loading state.** Replace the bare `loading…` string (`page.tsx:341`)
with a static calendar-grid skeleton to remove the mount flash and the layout
shift when content lands.

**P2-7. `~` → `0` or nothing** in the month dropdown count column
(`MonthDropdown.tsx:109`).

**P2-8. Friendly `DayCell` `aria-label`** — spoken date instead of the raw key
(`DayCell.tsx:49`).

---

### Target system

| Axis | Today | Target |
|------|-------|--------|
| Button variants | ~8 | **3** — Primary, Quiet, Link |
| Radii | 6 (`0, 3px, 6, 8, 12, 16`) | **2** — 10px control, 16px container (+ `full` for dots) |
| Spacing | Tailwind scale + many half-steps | Tailwind scale restricted to `1 / 2 / 3 / 4 / 6 / 8`; drop `0.5 / 1.5 / 2.5` |
| Type sizes | 4 (no step between base & "small") | **3** — label / body / display |
| Font weights | 600 + one bold | **2** — 500 / 700 |
| Color tokens | 8 (+ ~20 opacity derivatives) | **6** roles (`bg, surface, fg, dim, border, accent`) + **1** data hue (`scheduled`); drop `logged` (≡ `accent`) |
| Themes | 10 presets + custom accent | **1** tuned theme + custom accent |
| Focus ring | `ring-2` / `ring-1` / none | **`ring-2 ring-inset ring-accent`** everywhere |
| Glow / scanlines / blink | glow ×3, scanlines (dead), blink ×1 | **none** |
| Motion | 9 effects incl. 1 infinite + 1 easter egg | `PRESSABLE` + one 200–300ms state transition + native scroll-snap. Nothing looping. |
| Press affordance | `PRESSABLE` on 5/19 controls | **all** controls |

---

## 5. North star

trainlog is a training calendar that should feel like a considered native app,
not a terminal emulator. Hierarchy comes from weight, size, and whitespace —
never from glow, blink, or ASCII ornament. The system is deliberately small: one
type scale of three steps, one spacing scale, one control radius and one
container radius, three button roles, one text-link, one focus ring, one active
state. A single confident theme, tuned once to pass AA, with the accent color
spent on exactly one thing per screen — today, the current lift, the primary
action. Motion is short, purposeful, and interruptible: a press response and a
single state transition, nothing that loops or sparkles. Every interactive
element declares itself the same way, on every input path. When a treatment
isn't making the screen clearer, calmer, or faster, it's noise — cut it.
