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
  statsDirection?: "row" | "col";
  /** Resting body is stats (calendar / desktop rail). */
  showStats?: boolean;
  sheetDate: DateKey | null;
  onSelectSplit: (date: DateKey, split: Split) => void;
  onClearDay: (date: DateKey) => void;
  onAddPR: (date: DateKey, input: { exerciseName: string; weight: number; note?: string }) => void;
  onRemovePR: (id: string) => void;
  onCloseSheet: () => void;
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
  /** Fill the rail (desktop). Phone always hugs content. */
  fill?: boolean;
};

const SHELL = "rounded-2xl bg-surface";

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
  showStats = true,
  scrollClassName,
  ...props
}: CurrentCardProps) {
  const body = cardBody({
    themeOpen: props.themeOpen,
    prSheet: props.prSheet,
    sheetDate: props.sheetDate,
    showStats,
  });

  useEffect(() => {
    if (body === null || body === "stats") return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (props.themeOpen) props.onCloseTheme();
      else if (props.prSheet !== null) props.onClosePR();
      else props.onCloseSheet();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [body, props.themeOpen, props.prSheet, props.onCloseTheme, props.onClosePR, props.onCloseSheet]);

  if (body === null) return null;

  let inner = (
    <StatsView
      streakWeeks={props.streakWeeks}
      prEntries={props.prEntries}
      trainedDays={props.trainedDays}
      todayKey={props.todayKey}
      onOpenTheme={props.onOpenTheme}
      statsDirection={props.statsDirection}
      fill={fill}
    />
  );
  if (body === "theme") {
    inner = (
      <ThemeView
        selection={props.theme}
        onSelectPreset={props.onSelectPreset}
        onSetAccent={props.onSetAccent}
        onImported={props.onImported}
        onClose={props.onCloseTheme}
        fill={fill}
        scrollClassName={scrollClassName}
      />
    );
  } else if (body === "pr" && props.prSheet !== null) {
    inner = (
      <PRFormView
        sheet={props.prSheet}
        prEntries={props.prEntries}
        todayKey={props.todayKey}
        onSubmit={props.onSubmitPR}
        onDelete={props.onDeletePR}
        onClose={props.onClosePR}
        fill={fill}
        scrollClassName={scrollClassName}
      />
    );
  } else if (body === "day" && props.sheetDate !== null) {
    inner = (
      <DayFormView
        date={props.sheetDate}
        prEntries={props.prEntries}
        trainedDays={props.trainedDays}
        onSelectSplit={props.onSelectSplit}
        onClearDay={props.onClearDay}
        onAddPR={props.onAddPR}
        onRemovePR={props.onRemovePR}
        onClose={props.onCloseSheet}
        fill={fill}
        scrollClassName={scrollClassName}
      />
    );
  }

  return (
    <div
      className={[
        SHELL,
        "p-4",
        fill
          ? "flex h-full min-h-0 flex-col"
          : "max-h-[42dvh] overflow-y-auto lg:max-h-none",
      ].join(" ")}
    >
      {inner}
    </div>
  );
}
