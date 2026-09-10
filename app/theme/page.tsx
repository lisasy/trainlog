"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { PRESSABLE } from "@/lib/styles";
import { THEME_PRESETS, resolveTheme } from "@/lib/theme";
import { seedEntries, seedTrainedDays } from "@/lib/seed";
import type { Split } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import MonthDropdown from "@/components/MonthDropdown";
import YearHeatmap from "@/components/YearHeatmap";
import DayForm from "@/components/DayForm";
import PRForm from "@/components/PRForm";
import DayCell from "@/components/DayCell";
import { WeekdayHeader } from "@/components/Calendar";
import { StatTiles } from "@/components/StatsPanel";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import IconButton from "@/components/ui/IconButton";
import TextAction from "@/components/ui/TextAction";
import {
  Code,
  Flag,
  Note,
  PresetSwatches,
  Section,
  Spec,
  Stage,
  Swatch,
  ThemeScope,
} from "./parts";

const noop = () => {};

const TOC: { id: string; label: string }[] = [
  { id: "principles", label: "principles" },
  { id: "color", label: "color & theming" },
  { id: "type", label: "typography" },
  { id: "spacing", label: "spacing & layout" },
  { id: "radii", label: "radii & elevation" },
  { id: "buttons", label: "buttons & controls" },
  { id: "forms", label: "form inputs" },
  { id: "motion", label: "motion & affordances" },
  { id: "icons", label: "iconography" },
];

const SEED_ENTRIES = seedEntries();
const SEED_DAYS = seedTrainedDays();
/** Fixed reference date so the specimens don't drift with the wall clock. */
const REF_TODAY = "2026-09-06";

const DEMO_MONTHS = [
  new Date(2026, 8, 1),
  new Date(2026, 7, 1),
  new Date(2026, 6, 1),
  new Date(2026, 5, 1),
];
const DEMO_COUNTS: Record<string, number> = {
  "2026-09": 5,
  "2026-08": 12,
  "2026-07": 17,
  "2026-06": 16,
};

const DAY_CELL_STATES: {
  label: string;
  date: string;
  day: string;
  inMonth?: boolean;
  isToday?: boolean;
  isFuture?: boolean;
  isCursor?: boolean;
  trained?: boolean;
}[] = [
  { label: "outside", date: "2026-08-31", day: "31", inMonth: false },
  { label: "plain", date: "2026-09-02", day: "02" },
  { label: "logged", date: "2026-09-04", day: "04", trained: true },
  { label: "scheduled", date: "2026-09-20", day: "20", trained: true, isFuture: true },
  { label: "today", date: "2026-09-06", day: "06", isToday: true },
  { label: "cursor", date: "2026-09-09", day: "09", isCursor: true },
  { label: "logged+cursor", date: "2026-09-01", day: "01", trained: true, isCursor: true },
];

export default function ThemePage() {
  const [presetId, setPresetId] = useState(THEME_PRESETS[0].id);
  const [navView, setNavView] = useState<"calendar" | "prs" | "splits" | "gallery">("calendar");
  const [demoCompleted, setDemoCompleted] = useState(true);
  const [demoSplit, setDemoSplit] = useState<Split | undefined>("lower");

  const previewVars = resolveTheme({ presetId });

  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-24 sm:px-8">
      <header className="border-b border-dotted border-border pb-6">
        <p className="text-dim">
          <span className="text-accent glow">trainlog</span> / design system
        </p>
        <h1 className="mt-2 text-2xl text-fg">The style guide</h1>
        <p className="mt-3 max-w-[64ch] text-dim">
          The canonical reference for every design decision in the app: the tokens as they
          really resolve, the components as they really render. If something here disagrees
          with the code, the code is the bug. Values are pulled live from{" "}
          <Code>lib/theme.ts</Code>, <Code>lib/styles.ts</Code> and <Code>app/globals.css</Code>.
        </p>

        <nav aria-label="Sections" className="mt-5 flex flex-wrap gap-x-4 gap-y-1">
          {TOC.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="link cursor-pointer text-dim transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="flex flex-col gap-2">
        {/* ── Principles ─────────────────────────────────────────────── */}
        <Section id="principles" title="Principles">
          <Note>
            trainlog is a training calendar that should feel like a considered native app, not
            a terminal emulator. Hierarchy comes from weight, size, and whitespace — never from
            glow, blink, or ASCII ornament. The system is deliberately small: one type scale of
            three steps, one spacing scale, one control radius and one container radius, three
            button roles, one text-link, one focus ring, one active state. A single confident
            theme, tuned once to pass AA, with the accent colour spent on exactly one thing per
            screen — today, the current lift, the primary action. Motion is short, purposeful,
            and interruptible: a press response and a single state transition, nothing that
            loops or sparkles. Every interactive element declares itself the same way, on every
            input path. When a treatment isn&apos;t making the screen clearer, calmer, or
            faster, it&apos;s noise — cut it.
          </Note>
          <Flag>
            The list below is where the <em>code</em> is today, with its drift called out —
            not the target above. The gap between the two is the backlog
            (<Code>docs/design-system-backlog.md</Code>).
          </Flag>
          <ol className="flex max-w-[64ch] list-none flex-col gap-3">
            <Principle n="01" title="Restraint first">
              Every element earns its place. No decoration that isn&apos;t also information —
              the one indulgence is a single <Code>.glow</Code> on the wordmark.
            </Principle>
            <Principle n="02" title="One size, mostly">
              The body is a single type size at every viewport. Hierarchy is meant to come from
              colour and position, not from scale or weight. (Reality has drifted — see
              Typography.)
            </Principle>
            <Principle n="03" title="Colour carries meaning">
              Warm <span className="text-logged">accent</span> = training already done. Cool{" "}
              <span className="text-scheduled">teal</span> = scheduled ahead. Split type is a
              label, never a colour.
            </Principle>
            <Principle n="04" title="Elevation without shadow">
              Depth is one step of lightness — <Code>bg</Code> → <Code>surface</Code>. Shadows
              are reserved for things that genuinely float over content (one dropdown).
            </Principle>
            <Principle n="05" title="iOS-ready">
              Safe-area insets everywhere, <Code>standalone</Code> manifest, no-flash theme
              script, touch targets ≥ 36px, <Code>tap-target</Code> kills the tap flash and
              callout. The component vocabulary should port to SwiftUI without translation.
            </Principle>
          </ol>
        </Section>

        {/* ── Color & theming ────────────────────────────────────────── */}
        <Section id="color" title="Color & theming">
          <Note>
            Eight semantic tokens. Every colour in the app resolves to one of them, so a theme
            is only ever a swap of these eight values on <Code>:root</Code>. Components never
            name a theme.
          </Note>

          <div className="mt-1">
            <Swatch color="#191919" name="--bg">
              The page ground. <Code>bg-bg</Code>, and the <Code>html/body</Code> background so
              iOS rubber-band doesn&apos;t flash white.
            </Swatch>
            <Swatch color="#1f1f1f" name="--surface">
              One step up from <Code>bg</Code>. Cards, chips, pills, the floating{" "}
              <Code>CARD</Code>, dock veil target — elevation without a border.
            </Swatch>
            <Swatch color="#bbbbbb" name="--fg">
              Primary text. Also used at low alpha (<Code>fg/5</Code>–<Code>fg/15</Code>) for
              hover fills and hairline rings.
            </Swatch>
            <Swatch color="#b77e64" name="--accent">
              The one bright colour: wordmark, active states, primary-button border, focus
              ring, <Code>.glow</Code>. In every preset this is also <Code>--logged</Code>.
            </Swatch>
            <Swatch color="#898180" name="--dim">
              Secondary text — labels, captions, weekday headers, meta. Lifted from the raw
              scheme value to clear WCAG AA (4.5:1) on <Code>bg</Code>; every preset&apos;s{" "}
              <Code>dim</Code> carries the same correction.
            </Swatch>
            <Swatch color="#3d3839" name="--border">
              Hairlines and dotted rules. Solid for inputs and stage edges, dotted for section
              and list separators.
            </Swatch>
            <Swatch color="#b77e64" name="--logged">
              Training already done — the filled calendar dot, the PR-ledger weight, the
              heatmap. Equal to <Code>--accent</Code> in all 10 presets and driven by the
              custom-accent override too.
            </Swatch>
            <Swatch color="#46cab2" name="--scheduled">
              Training scheduled ahead — dashed calendar dot, future heatmap cells. The only
              token that moves independently of the accent.
            </Swatch>
          </div>

          <Flag>
            <Code>--logged</Code> is never independent of <Code>--accent</Code>. It exists as a
            seam for &ldquo;colour by what, not when&rdquo; that was never taken. Backlog P2:
            collapse it, or commit to it.
          </Flag>

          <h3 className="mt-4 text-fg">How theming works</h3>
          <Note>
            <Code>lib/theme.ts</Code> holds the preset table. On selection,{" "}
            <Code>applyTheme()</Code> writes the eight vars onto{" "}
            <Code>document.documentElement.style</Code> and persists the resolved values.{" "}
            <Code>@theme inline</Code> in <Code>globals.css</Code> maps each{" "}
            <Code>--color-*</Code> Tailwind uses back to the raw var, so the swap is instant
            and total. <Code>NO_FLASH_SCRIPT</Code> runs in <Code>&lt;head&gt;</Code> before
            first paint and re-applies the stored vars so a non-default theme never flashes.
          </Note>
          <Note>
            A custom accent (any valid 3- or 6-digit hex) overrides <Code>accent</Code> and{" "}
            <Code>logged</Code> together — picking one otherwise leaves the calendar unchanged.
          </Note>

          <h3 className="mt-4 text-fg">Presets</h3>
          <Note>
            All 10, rendered from their own stored values (bg · fg · accent · scheduled). Tap a
            row to preview it against real components below.
          </Note>
          <div className="mt-1 grid gap-1 sm:grid-cols-2">
            {THEME_PRESETS.map((preset) => {
              const active = preset.id === presetId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setPresetId(preset.id)}
                  aria-pressed={active}
                  className={[
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left",
                    PRESSABLE,
                    "hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
                    active ? "bg-fg/10 text-fg" : "text-fg/90",
                  ].join(" ")}
                >
                  <span className="min-w-0 flex-1 truncate">{preset.label}</span>
                  <PresetSwatches
                    colors={[
                      preset.vars.bg,
                      preset.vars.fg,
                      preset.vars.accent,
                      preset.vars.scheduled,
                    ]}
                  />
                </button>
              );
            })}
          </div>

          <div className="mt-3">
            <ThemeScope vars={previewVars}>
              <p className="text-dim">
                preview · <span className="text-fg">{presetId}</span>
              </p>
              <div className="mt-3">
                <StatTiles
                  streakWeeks={3}
                  prEntries={SEED_ENTRIES}
                  trainedDays={SEED_DAYS}
                  todayKey={REF_TODAY}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-lg bg-surface px-3 py-1.5 text-dim">surface chip</span>
                <span className="rounded-lg border border-accent px-3 py-1.5 text-accent">
                  accent outline
                </span>
                <span className="text-logged">logged</span>
                <span className="text-scheduled">scheduled</span>
              </div>
            </ThemeScope>
          </div>
        </Section>

        {/* ── Typography ─────────────────────────────────────────────── */}
        <Section id="type" title="Typography">
          <Note>
            Family: <Code>JetBrains Mono</Code> (via <Code>next/font</Code>), falling back to{" "}
            <Code>ui-monospace, monospace</Code>. Loaded as <Code>--font-jetbrains-mono</Code>{" "}
            and referenced through <Code>--font-mono</Code>.
          </Note>

          <div className="mt-1">
            <Spec name="body" value="0.85rem / 600">
              <span className="text-fg" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                The quick brown fox
              </span>{" "}
              — set on <Code>body</Code>, <Code>line-height: 1.5</Code>,{" "}
              <Code>letter-spacing: 0</Code>. The intended single size.
            </Spec>
            <Spec name="text-sm" value="0.875rem">
              <span className="text-fg text-sm">The quick brown fox</span> — labels, captions,
              weekday headers, notes, the <Code>LABEL</Code> constant. Used constantly.
            </Spec>
            <Spec name="text-lg" value="1.125rem">
              <span className="text-fg text-lg">The quick brown fox</span> — one use: the{" "}
              <Code>+</Code> add-PR glyph per exercise group in the ledger.
            </Spec>
            <Spec name="text-2xl" value="1.5rem">
              <span className="text-fg text-2xl">Fox</span> — stat-tile numbers, the phone
              calendar&apos;s month title (<Code>MonthDropdown</Code> <Code>variant=&quot;title&quot;</Code>).
            </Spec>
            <Spec name="font-bold" value="700">
              <span className="text-dim" style={{ fontWeight: 700 }}>
                09
              </span>{" "}
              — day numbers in <Code>DayCell</Code> step above the body&apos;s 600.
            </Spec>
            <Spec name=".glow" value="text-shadow">
              <span className="text-accent glow">trainlog</span> —{" "}
              <Code>0 0 6px accent@45%</Code>. Wordmark, active month path, &ldquo;Today&rdquo;
              heading. The single decorative treatment.
            </Spec>
            <Spec name="uppercase + tracking-wide">
              <span className="text-sm tracking-wide text-dim uppercase">split</span> — form
              section labels and stat-tile labels. The only place tracking is non-zero.
            </Spec>
          </div>

          <Flag>
            &ldquo;One type size&rdquo; is aspirational, not current. There are five sizes in
            play (0.85 / 0.875 / 1.125 / 1.5rem + <Code>font-bold</Code>), and{" "}
            <Code>text-sm</Code> (0.875rem) is actually <em>larger</em> than the 0.85rem body
            it&apos;s meant to de-emphasise — the size relationship is inverted; only colour
            makes it read as secondary. Backlog P1: pick a real ramp (2–3 steps) or genuinely
            collapse to one.
          </Flag>
          <Flag>
            <Code>globals.css</Code> claims the body is 16px &ldquo;so iOS doesn&apos;t zoom on
            input focus.&rdquo; It&apos;s 0.85rem ≈ 13.6px, and inputs inherit it — iOS{" "}
            <em>will</em> zoom. Backlog P0: bump input font-size to ≥16px (or the whole body)
            and fix the comment.
          </Flag>
        </Section>

        {/* ── Spacing & layout ───────────────────────────────────────── */}
        <Section id="spacing" title="Spacing & layout">
          <Note>
            No custom spacing scale — Tailwind&apos;s default steps, used ad hoc. The cluster
            that actually recurs:
          </Note>
          <div className="mt-1">
            <Spec name="gap / p 1.5–2" value="0.375–0.5rem">
              Inside controls: day cells, split-tile grid, chip padding.
            </Spec>
            <Spec name="gap / p 2–3" value="0.5–0.75rem">
              Between controls and rows: form field stacks, stat-tile gaps, list rows.
            </Spec>
            <Spec name="p-4" value="1rem">
              The <Code>CARD</Code> interior, stage padding.
            </Spec>
            <Spec name="mt-5 / gap-6" value="1.25–1.5rem">
              Between form sections; stats heading → tiles.
            </Spec>
            <Spec name="h-11" value="2.75rem">
              The header bar height — sidebar header, body header and theme sheet header all
              pin to it so their bottom borders align.
            </Spec>
          </div>

          <h3 className="mt-4 text-fg">Layout primitives</h3>
          <div className="mt-1">
            <Spec name="sidebar" value="15rem">
              Desktop left rail (<Code>lg:</Code>+): wordmark, view nav, theme link. Dotted
              right border.
            </Spec>
            <Spec name="right rail" value="23rem">
              Desktop right rail: the floating <Code>CARD</Code> at <Code>fill</Code> height —
              today&apos;s stats, or the day / PR form.
            </Spec>
            <Spec name="theme sheet" value="24rem">
              Bottom sheet on phone (<Code>max-h-85dvh</Code>), right drawer at{" "}
              <Code>lg:</Code>.
            </Spec>
            <Spec name="dropdown" value="12rem / max-h 20rem">
              <Code>MonthDropdown</Code> listbox. Autocomplete list is{" "}
              <Code>max-h-12rem</Code>.
            </Spec>
            <Spec name="dock veil" value="—">
              Phone only: <Code>.dock-veil</Code> — blurred, bottom-weighted{" "}
              <Code>bg</Code> gradient, masked to transparent toward the top so the calendar
              reads above it and dissolves into frost below. The dock is{" "}
              <Code>pointer-events-none</Code> except its content.
            </Spec>
            <Spec name="content column" value="max-w-3xl">
              This page. The app itself is full-bleed between the rails.
            </Spec>
          </div>

          <h3 className="mt-4 text-fg">Safe area</h3>
          <Note>
            <Code>viewport-fit: cover</Code> in the layout. Every screen edge that can meet a
            notch or home indicator uses{" "}
            <Code>env(safe-area-inset-*)</Code>, usually as{" "}
            <Code>max(0.75rem, env(safe-area-inset-bottom))</Code> so there&apos;s a floor when
            the inset is zero. <Code>overscroll-behavior: none</Code> on <Code>html</Code>;{" "}
            <Code>overflow-x: hidden</Code> on <Code>body</Code>.
          </Note>
        </Section>

        {/* ── Radii & elevation ──────────────────────────────────────── */}
        <Section id="radii" title="Radii & elevation">
          <Stage label="every radius in use">
            <RadiusChip r="rounded-[3px]" px="3px" note="heatmap cells" />
            <RadiusChip r="rounded-md" px="6px" note="day cells" />
            <RadiusChip r="rounded-lg" px="8px" note="buttons, inputs, chips, list rows" />
            <RadiusChip r="rounded-xl" px="12px" note="bottom-nav items" />
            <RadiusChip r="rounded-2xl" px="16px" note="CARD, stat tiles, nav container" />
            <RadiusChip r="rounded-full" px="9999px" note="calendar status dots" />
          </Stage>
          <Flag>
            Six radii for what wants to be two or three, and <Code>ThemePicker</Code> opts out
            entirely — <Code>rounded-none</Code> fields, square swatches,{" "}
            <Code>[ bracket ]</Code> buttons. It&apos;s the last screen still on the pure
            terminal aesthetic. Backlog P1: settle on{" "}
            <Code>sm 6 / md 10 / lg 16 / full</Code> and migrate the picker.
          </Flag>

          <h3 className="mt-4 text-fg">Elevation</h3>
          <Note>
            Two levels, no more. <Code>bg</Code> is the ground; <Code>surface</Code> is
            &ldquo;lifted&rdquo; — cards, chips, the dock. There are no drop shadows anywhere
            except:
          </Note>
          <div className="mt-1">
            <Spec name="shadow-lg" value="Tailwind default">
              <Code>MonthDropdown</Code> listbox only — it genuinely floats over the grid.
            </Spec>
            <Spec name=".glow-box" value="0 0 10px accent@30%">
              Defined in <Code>globals.css</Code>, <span className="text-accent">unused</span>.
              Backlog P2: wire it to the today cell or delete it.
            </Spec>
            <Spec name=".scanlines" value="fixed overlay">
              CRT scanline overlay, also <span className="text-accent">defined and never
              mounted</span>. Backlog P1: delete (it&apos;s off-brand for the new direction).
            </Spec>
          </div>
        </Section>

        {/* ── Buttons & controls ─────────────────────────────────────── */}
        <Section id="buttons" title="Buttons & controls">
          <Note>
            The primitives live in <Code>components/ui/</Code> and each folds in{" "}
            <Code>PRESSABLE</Code> + <Code>FOCUS_RING</Code> (both from{" "}
            <Code>lib/styles.ts</Code>) so call sites never re-type them.{" "}
            <Code>PRESSABLE</Code> is the shared press affordance —{" "}
            <Code>cursor-pointer</Code>, <Code>active:scale-[0.98]</Code>,{" "}
            <Code>active:brightness-90</Code> on one merged <Code>transition-[…]</Code>;{" "}
            <Code>FOCUS_RING</Code> is the one focus treatment (2px inset accent ring, no
            outline). States are live on every specimen below — click through them.
          </Note>

          <Stage label="Button — primary · quiet · ghost · disabled">
            <Button variant="primary" onClick={noop}>
              add
            </Button>
            <Button variant="quiet" onClick={noop}>
              today
            </Button>
            <Button variant="ghost" onClick={noop}>
              done
            </Button>
            <Button variant="primary" disabled onClick={noop}>
              add
            </Button>
          </Stage>
          <Note>
            <Code>components/ui/Button.tsx</Code>. Three roles, <Code>size</Code>{" "}
            <Code>sm</Code> (<Code>h-9</Code>) / <Code>md</Code> (<Code>h-10</Code>),{" "}
            <Code>rounded-lg</Code>. <Code>primary</Code> is the one accent-filled action
            per screen; <Code>quiet</Code> is surface-filled (nav, chips, toolbar);{" "}
            <Code>ghost</Code> is text-only until hover. Disabled →{" "}
            <Code>opacity-40</Code>, press cancelled. <Code>NavButton</Code> is now a thin
            alias (<Code>emphasis</Code> → <Code>primary</Code>, else <Code>quiet sm</Code>).
          </Note>

          <Stage label="IconButton — ghost sm · surface sm · md">
            <IconButton icon={Plus} label="Add" size="sm" onClick={noop} />
            <IconButton icon={X} label="Remove" size="sm" variant="surface" onClick={noop} />
            <IconButton icon={Plus} label="Add" onClick={noop} />
          </Stage>
          <Note>
            <Code>components/ui/IconButton.tsx</Code>. Icon-only, <Code>label</Code>{" "}
            required (→ <Code>aria-label</Code>). <Code>sm</Code> = 36px box / 16px glyph
            for inline rows, <Code>md</Code> = 44px / 20px standalone. Inline uses pass a
            negative-margin <Code>className</Code> so the box doesn&apos;t grow the row.
          </Note>

          <Stage label="TextAction — the dotted text control">
            <TextAction onClick={noop}>close</TextAction>
            <TextAction onClick={noop} className="text-sm">
              clear this day
            </TextAction>
          </Stage>
          <Note>
            <Code>components/ui/TextAction.tsx</Code> wraps the <Code>.link</Code> class
            (<Code>app/globals.css</Code>) — a 1px dotted underline at{" "}
            <Code>currentColor@45%</Code> that goes solid on hover / focus. For actions
            that would otherwise read as labels: <Code>close</Code>, <Code>theme</Code>,{" "}
            <Code>clear this day</Code>, <Code>delete this pr</Code>.
          </Note>

          <Stage label="MonthDropdown — path variant · title variant">
            <MonthDropdown
              months={DEMO_MONTHS}
              activeMonth={DEMO_MONTHS[0]}
              countsByMonth={DEMO_COUNTS}
              currentMonthKey="2026-09"
              onSelectMonth={noop}
            />
            <MonthDropdown
              variant="title"
              months={DEMO_MONTHS}
              activeMonth={DEMO_MONTHS[0]}
              countsByMonth={DEMO_COUNTS}
              currentMonthKey="2026-09"
              onSelectMonth={noop}
            />
          </Stage>
          <Note>
            Path variant is bare accent text with <Code>.glow</Code> and no hover fill (it
            reads as a breadcrumb). Title variant is <Code>text-2xl</Code> +{" "}
            <Code>PRESSABLE</Code>. Both open the same <Code>shadow-lg</Code> listbox — the
            app&apos;s one real menu.
          </Note>

          <Stage label="BottomNav — phone tab bar (real, interactive)">
            <BottomNav view={navView} onSelectView={setNavView} />
          </Stage>
          <Note>
            <Code>rounded-2xl</Code> container, <Code>rounded-xl</Code> items, 22px lucide
            icons. Active: <Code>bg-fg/10 text-fg</Code>. Inactive:{" "}
            <Code>hover:bg-fg/5 hover:text-accent</Code>. This is the canonical
            &ldquo;segmented control&rdquo; shape.
          </Note>

          <Flag>
            Still one-off: the <Code>HEADER_CHIP</Code> constant in <Code>Calendar.tsx</Code>{" "}
            (year label + <Code>TODAY</Code> button, <Code>h-8</Code>), and{" "}
            <Code>ThemeFaceButton</Code>&apos;s <Code>:)</Code> (an emoji, not a lucide
            glyph, so it can&apos;t use <Code>IconButton</Code>). Backlog: a{" "}
            <Code>&lt;Chip&gt;</Code> primitive, and settle the face button.
          </Flag>

          <h3 className="mt-4 text-fg">DayCell — the calendar&apos;s tappable unit</h3>
          <Stage label="WeekdayHeader + DayCell states">
            <div className="w-full max-w-xs">
              <WeekdayHeader />
              <div className="mt-1 grid grid-cols-7 gap-x-1 px-1.5 sm:px-2">
                {DAY_CELL_STATES.map((state) => (
                  <div key={state.label} className="h-14">
                    <DayCell
                      date={state.date}
                      dayNumber={state.day}
                      inMonth={state.inMonth ?? true}
                      isToday={state.isToday ?? false}
                      isFuture={state.isFuture ?? false}
                      isCursor={state.isCursor ?? false}
                      isSelected={false}
                      trainedDay={state.trained ? { date: state.date, split: "pull" } : undefined}
                      onTap={noop}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-sm text-dim">
                left→right: outside-month (inert) · plain · logged (filled dot) · scheduled
                (dashed border + dim dot) · today (accent ring + hollow dot) · keyboard cursor
                (<Code>fg/60</Code> ring) · logged + cursor
              </p>
            </div>
          </Stage>
          <Note>
            <Code>rounded-md</Code>, <Code>PRESSABLE</Code>, day number stays{" "}
            <Code>text-dim</Code> + <Code>font-bold</Code> — status is carried entirely by the
            cell chrome and the 6–8px dot, never by the number. This is the clearest expression
            of &ldquo;colour and position, not scale.&rdquo;
          </Note>

        </Section>

        {/* ── Form inputs ────────────────────────────────────────────── */}
        <Section id="forms" title="Form inputs">
          <Note>
            One field — <Code>components/ui/Field.tsx</Code>:{" "}
            <Code>rounded-lg border border-border bg-bg/40 px-3 py-2</Code>,{" "}
            <Code>focus:border-accent</Code>, <Code>placeholder:text-dim</Code>,{" "}
            <Code>appearance-none</Code>. Font size is <Code>text-base</Code> (16px) — load-bearing,
            anything smaller makes iOS Safari zoom on focus. <Code>type=&quot;date&quot;</Code>{" "}
            gets <Code>color-scheme: dark</Code> automatically. <Code>PRForm</Code> and the theme
            sheet&apos;s accent input both use it now.
          </Note>

          <Stage label="Field — text · number · date · disabled">
            <div className="flex w-full max-w-sm flex-col gap-2">
              <Field placeholder="exercise" aria-label="demo text" />
              <Field inputMode="decimal" placeholder="weight" aria-label="demo number" />
              <Field type="date" aria-label="demo date" />
              <Field placeholder="disabled" aria-label="demo disabled" disabled />
            </div>
          </Stage>

          <Stage label="PRForm — Field ×4, autocomplete, Button primary + ghost">
            <div className="w-full max-w-sm">
              <PRForm
                allEntries={SEED_ENTRIES}
                todayKey={REF_TODAY}
                onSubmit={noop}
                onCancel={noop}
              />
            </div>
          </Stage>
          <Note>
            Focus the exercise field for the autocomplete list —{" "}
            <Code>absolute</Code>, <Code>border border-border bg-bg</Code>,{" "}
            <Code>max-h-12rem</Code>, rows <Code>hover:bg-fg/10</Code> (the one remaining
            list-option one-off — backlog <Code>&lt;OptionGroup&gt;</Code>). The submit is{" "}
            <Code>&lt;Button variant=&quot;primary&quot;&gt;</Code>, disabled until valid;
            cancel is <Code>&lt;Button variant=&quot;ghost&quot;&gt;</Code>.
          </Note>

          <Stage label="DayForm — complete toggle, optional split, attached-PR rows">
            <div className="w-full max-w-sm">
              <DayForm
                trainedDay={
                  demoCompleted
                    ? { date: REF_TODAY, ...(demoSplit ? { split: demoSplit } : {}) }
                    : undefined
                }
                entries={SEED_ENTRIES.filter((e) => e.date === "2026-08-18").slice(0, 2)}
                onMarkCompleted={() => setDemoCompleted(true)}
                onSelectSplit={(s) => setDemoSplit((current) => (current === s ? undefined : s))}
                onClearDay={() => {
                  setDemoCompleted(false);
                  setDemoSplit(undefined);
                }}
                onRemovePR={noop}
              />
            </div>
          </Stage>
          <Note>
            A day is completed first. Split tiles only appear after{" "}
            <Code>Completed</Code>, and are optional — tap the active split to clear it.
          </Note>
        </Section>

        {/* ── Motion & affordances ───────────────────────────────────── */}
        <Section id="motion" title="Motion & affordances">
          <div className="mt-1">
            <Spec name="PRESSABLE" value="100ms">
              <Code>active:scale-[0.98]</Code> + <Code>active:brightness-90</Code>. The one
              press affordance — do not hand-roll another.
            </Spec>
            <Spec name="CARD slide/fade" value="300ms ease-out">
              <Code>transition-[transform,opacity]</Code> — the floating card cross-fades and
              slides ~4–16px as stats ⇄ day form ⇄ PR form swap. The outgoing state lingers
              300ms so it animates out.
            </Spec>
            <Spec name="tween()" value="easeOutCubic">
              <Code>lib/animate.ts</Code> — a generic rAF tween, snaps straight to target under
              reduced motion. <span className="text-accent">Currently unused</span> — the
              calendar scroller uses native <Code>scrollTo</Code>. Backlog P2: delete, or adopt
              it for the card.
            </Spec>
            <Spec name="heatmap shimmer" value="500ms ease-out">
              Easter egg: tapping the year heatmap ripples brightness out from the touch point,
              <Code>22ms</Code> per cell of Manhattan distance. Compositor-only (<Code>filter</Code>).
            </Spec>
            <Spec name=".tip" value="90ms linear">
              Hover tooltip opacity, gated behind <Code>@media (hover: hover)</Code> so it never
              latches open on touch. Day-cell splits (desktop) and BottomNav labels.
            </Spec>
            <Spec name="blink" value="1.1s steps(1)">
              The terminal cursor block beside the wordmark. Off under reduced motion.
            </Spec>
          </div>

          <h3 className="mt-4 text-fg">Reduced motion</h3>
          <Note>
            <Code>@media (prefers-reduced-motion: reduce)</Code> in <Code>globals.css</Code>{" "}
            disables the cursor blink and the heatmap shimmer, forces{" "}
            <Code>button:active</Code> transform to none (the brightness dim still gives
            feedback), and <Code>tween()</Code> jumps to its end value.
          </Note>
          <Flag>
            Two reduced-motion rules target stale selectors: <Code>.snap-y</Code> (the calendar
            scroller is <Code>snap-x</Code>) and a <Code>[data-month-key]</Code> opacity
            crossfade that no longer exists in <Code>Calendar.tsx</Code>. And the shimmer is{" "}
            <Code>500ms</Code> in CSS but <Code>SHIMMER_MS = 550</Code> in JS. Backlog P1: fix
            the selectors and reconcile the constant.
          </Flag>

          <h3 className="mt-4 text-fg">Live — heatmap</h3>
          <Stage label="YearHeatmap (real) — tap it">
            <div className="w-full max-w-md">
              <YearHeatmap year={2026} trainedDays={SEED_DAYS} todayKey={REF_TODAY} />
            </div>
          </Stage>
        </Section>

        {/* ── Iconography ────────────────────────────────────────────── */}
        <Section id="icons" title="Iconography">
          <Note>
            <Code>lucide-react</Code> only. No custom SVG. Four sizes, chosen per context, never
            scaled by CSS:
          </Note>
          <Stage label="the four sizes">
            <IconSize px={14} note="X in attached-PR rows — the smallest tap-away" />
            <IconSize px={16} note="chevrons & Dot in headers, menus, ledger markers" />
            <IconSize px={18} note="chevrons in the phone month title" />
            <IconSize px={22} note="BottomNav tab icons" />
          </Stage>
          <div className="mt-1">
            <Spec name="ChevronLeft/Right" value="16px">
              Desktop month step buttons.
            </Spec>
            <Spec name="ChevronUp/Down/Right" value="14 / 18px">
              <Code>MonthDropdown</Code> open/closed indicator — 14px path variant, 18px title.
            </Spec>
            <Spec name="Dot" value="16px">
              Active-row / current-PR marker in the dropdown, preset list, PR ledger.
            </Spec>
            <Spec name="X" value="14px">
              Remove an attached PR (<Code>DayForm</Code>).
            </Spec>
            <Spec name="Calendar/Trophy/BookOpen/Images" value="22px">
              <Code>BottomNav</Code>, one per view.
            </Spec>
          </div>
          <Note>
            Icons vs. text: the phone nav is icon-only; the desktop sidebar is text-only for the
            same views. The PR ledger&apos;s add-affordance is a typographic <Code>+</Code>{" "}
            (<Code>text-lg</Code>), not <Code>Plus</Code>. The theme sheet&apos;s actions are{" "}
            <Code>[ bracket ]</Code> text. Backlog P2: decide when a control gets an icon and
            hold to it.
          </Note>
          <Flag>
            <Code>package.json</Code> pins <Code>lucide-react@^1.41.0</Code> — verify that&apos;s
            the intended line (the library&apos;s public releases are <Code>0.x</Code>). Backlog
            P2.
          </Flag>
        </Section>

        <p className="mt-12 border-t border-dotted border-border pt-6 text-sm text-dim">
          Refactor backlog: <Code>docs/design-system-backlog.md</Code>. Taste audit &amp;
          cut-list: <Code>docs/design-audit.md</Code> (Iris).
        </p>
      </main>
    </div>
  );
}

function Principle({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[2.5rem_1fr] gap-x-2">
      <span className="text-dim">{n}</span>
      <span>
        <span className="text-fg">{title}.</span>{" "}
        <span className="text-dim">{children}</span>
      </span>
    </li>
  );
}

function RadiusChip({ r, px, note }: { r: string; px: string; note: string }) {
  return (
    <span className="flex flex-col items-center gap-1.5 text-sm text-dim">
      <span className={`h-12 w-12 border border-accent/60 bg-surface ${r}`} aria-hidden />
      <span className="text-fg">{px}</span>
      <span className="max-w-[8rem] text-center">{note}</span>
    </span>
  );
}

function IconSize({ px, note }: { px: number; note: string }) {
  return (
    <span className="flex items-center gap-2 text-sm text-dim">
      <span
        className="inline-flex items-center justify-center rounded-md border border-border bg-surface"
        style={{ width: px + 16, height: px + 16 }}
      >
        <X size={px} className="text-fg" aria-hidden />
      </span>
      <span className="text-fg">{px}px</span>
      <span className="max-w-[22ch]">{note}</span>
    </span>
  );
}
