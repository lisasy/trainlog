"use client";

import { useEffect } from "react";

import type { DateKey, PREntry, Split, TrainedDaysMap } from "@/lib/types";
import type { ThemeSelection } from "@/lib/theme";
import {
  DayFormView,
  PRFormView,
  StatsView,
  type PRSheet,
} from "./DayCardContent";
import type { PRFormInput } from "./PRForm";
import ThemeView from "./ThemePicker";

export type CurrentCardContentProps = {
  streakWeeks: number;
  prEntries: PREntry[];
  trainedDays: TrainedDaysMap;
  todayKey: DateKey;
  /** Resting body is stats (calendar / desktop rail). */
  showStats?: boolean;
  yearView?: boolean;
  yearFocus?: number;
  sheetDate: DateKey | null;
  onMarkCompleted: (date: DateKey) => void;
  onSelectSplit: (date: DateKey, split: Split) => void;
  onClearDay: (date: DateKey) => void;
  onRemovePR: (id: string) => void;
  onCloseSheet: () => void;
  onOpenToday?: () => void;
  onOpenPRs?: () => void;
  prSheet: PRSheet | null;
  onSubmitPR: (input: PRFormInput) => void;
  onDeletePR: (id: string) => void;
  onClosePR: () => void;
  themeOpen: boolean;
  theme: ThemeSelection;
  onOpenTheme: () => void;
  onCloseTheme: () => void;
  onSelectPreset: (presetId: string) => void;
  onSetAccent: (accent: string | undefined) => void;
  onImported: (data: { trainedDays: TrainedDaysMap; prEntries: PREntry[] }) => void;
  scrollClassName?: string;
};

export type CurrentCardProps = CurrentCardContentProps & {
  /** Fill the rail (desktop). */
  fill?: boolean;
  /** Phone dock: fill the leftover under the calendar (rest or week-focus). */
  sheetFill?: boolean;
  /** Phone dock: edge-to-edge sheet with a large top radius. */
  bleed?: boolean;
};

const SHELL = "rounded-2xl bg-surface";
const BLEED =
  "rounded-t-[32px] bg-[linear-gradient(to_bottom,var(--surface),var(--bg))]";

export type CardBody = "theme" | "pr" | "day" | "stats";

export function cardBody(props: {
  themeOpen: boolean;
  prSheet: PRSheet | null;
  sheetDate: DateKey | null;
  showStats: boolean;
}): CardBody | null {
  if (props.themeOpen) return "theme";
  if (props.prSheet !== null) return "pr";
  if (props.sheetDate !== null) return "day";
  if (props.showStats) return "stats";
  return null;
}

/**
 * One floating card. Chrome stays; the body swaps (stats, day, ledger PR, theme).
 * Theme replaces the previous body; closing theme restores it because sheetDate /
 * prSheet are left intact.
 */
export default function CurrentCard({
  fill = false,
  sheetFill = false,
  bleed = false,
  showStats = true,
  scrollClassName,
  themeOpen,
  prSheet,
  sheetDate,
  onCloseTheme,
  onClosePR,
  onCloseSheet,
  ...props
}: CurrentCardProps) {
  const body = cardBody({ themeOpen, prSheet, sheetDate, showStats });
  // Both the desktop rail (`fill`) and the phone day sheet (`sheetFill`)
  // render the flex column layout with an internally-scrolling body.
  const filling = fill || sheetFill;

  useEffect(() => {
    if (body === null || body === "stats") return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (themeOpen) onCloseTheme();
      else if (prSheet !== null) onClosePR();
      else onCloseSheet();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [body, themeOpen, prSheet, onCloseTheme, onClosePR, onCloseSheet]);

  if (body === null) return null;

  let inner = (
    <StatsView
      streakWeeks={props.streakWeeks}
      prEntries={props.prEntries}
      trainedDays={props.trainedDays}
      todayKey={props.todayKey}
      onOpenToday={props.onOpenToday}
      onOpenPRs={props.onOpenPRs}
      fill={filling}
      variant={props.yearView ? "year" : "month"}
      yearFocus={props.yearFocus}
    />
  );
  if (body === "theme") {
    inner = (
      <ThemeView
        selection={props.theme}
        onSelectPreset={props.onSelectPreset}
        onSetAccent={props.onSetAccent}
        onImported={props.onImported}
        onClose={onCloseTheme}
        fill={filling}
        scrollClassName={scrollClassName}
      />
    );
  } else if (body === "pr" && prSheet !== null) {
    inner = (
      <PRFormView
        sheet={prSheet}
        prEntries={props.prEntries}
        todayKey={props.todayKey}
        onSubmit={props.onSubmitPR}
        onDelete={props.onDeletePR}
        onClose={onClosePR}
        fill={filling}
        scrollClassName={scrollClassName}
      />
    );
  } else if (body === "day" && sheetDate !== null) {
    inner = (
      <DayFormView
        date={sheetDate}
        todayKey={props.todayKey}
        prEntries={props.prEntries}
        trainedDays={props.trainedDays}
        onMarkCompleted={props.onMarkCompleted}
        onSelectSplit={props.onSelectSplit}
        onClearDay={props.onClearDay}
        onRemovePR={props.onRemovePR}
        onClose={onCloseSheet}
        fill={filling}
        scrollClassName={scrollClassName}
        homeChrome={bleed && !fill}
      />
    );
  }

  const phoneSheet = bleed && !fill;
  const shell = phoneSheet
    ? [
        BLEED,
        "flex w-full flex-col overflow-hidden px-6 pt-8 pb-6",
        sheetFill ? "h-full min-h-0" : "",
      ].join(" ")
    : fill
      ? `${SHELL} flex h-full min-h-0 flex-col p-4`
      : sheetFill
        ? `${SHELL} flex h-full min-h-0 flex-col p-4`
        : `${SHELL} p-4 max-h-[42dvh] overflow-y-auto lg:max-h-none`;

  return <div className={shell}>{inner}</div>;
}
