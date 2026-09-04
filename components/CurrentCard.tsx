"use client";

import { useEffect, useState } from "react";

import type { DateKey, PREntry, Split, TrainedDaysMap } from "@/lib/types";
import { DayFormView, PRFormView, StatsView, type PRSheet } from "./DayCardContent";
import type { PRFormInput } from "./PRForm";

export type CurrentCardProps = {
  streakWeeks: number;
  prEntries: PREntry[];
  trainedDays: TrainedDaysMap;
  todayKey: DateKey;
  onOpenTheme?: () => void;
  statsDirection?: "row" | "col";
  /** Fill the parent's height (desktop rail) vs. hug content (phone dock). */
  fill?: boolean;
  /** Whether the stats view is the resting state (false when off the calendar). */
  showStats?: boolean;
  /** The day being edited, or null. */
  sheetDate: DateKey | null;
  onSelectSplit: (date: DateKey, split: Split) => void;
  onClearDay: (date: DateKey) => void;
  onAddPR: (date: DateKey, input: { exerciseName: string; weight: number; note?: string }) => void;
  onRemovePR: (id: string) => void;
  onCloseSheet: () => void;
  /** A ledger PR being added/edited, or null. */
  prSheet: PRSheet | null;
  onSubmitPR: (input: PRFormInput) => void;
  onDeletePR: (id: string) => void;
  onClosePR: () => void;
  /** Height cap for the form's scroll region when not filling. */
  scrollClassName?: string;
};

const CARD =
  "rounded-2xl bg-surface transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none";

/**
 * The floating card that carries today's stats and, on demand, the day editor
 * or the PR add/edit form. One state slides/fades away as the next takes its
 * place. Shared verbatim by the phone dock and the desktop siderail.
 */
export default function CurrentCard({
  streakWeeks,
  prEntries,
  trainedDays,
  todayKey,
  onOpenTheme,
  statsDirection,
  fill = false,
  showStats = true,
  sheetDate,
  onSelectSplit,
  onClearDay,
  onAddPR,
  onRemovePR,
  onCloseSheet,
  prSheet,
  onSubmitPR,
  onDeletePR,
  onClosePR,
  scrollClassName,
}: CurrentCardProps) {
  const showForm = sheetDate !== null || prSheet !== null;

  // Each form renders at once on open (so it takes full height) and is held
  // for one transition-out after close via its `linger`.
  const [dayLinger, setDayLinger] = useState<DateKey | null>(null);
  useEffect(() => {
    if (sheetDate !== null) {
      setDayLinger(sheetDate);
      return;
    }
    const timeout = window.setTimeout(() => setDayLinger(null), 300);
    return () => window.clearTimeout(timeout);
  }, [sheetDate]);

  const [prLinger, setPrLinger] = useState<PRSheet | null>(null);
  useEffect(() => {
    if (prSheet !== null) {
      setPrLinger(prSheet);
      return;
    }
    const timeout = window.setTimeout(() => setPrLinger(null), 300);
    return () => window.clearTimeout(timeout);
  }, [prSheet]);

  const dayForRender = sheetDate ?? dayLinger;
  const prForRender = prSheet ?? prLinger;

  useEffect(() => {
    if (!showForm) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (prSheet !== null) onClosePR();
      else onCloseSheet();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showForm, prSheet, onClosePR, onCloseSheet]);

  const stats = (
    <StatsView
      streakWeeks={streakWeeks}
      prEntries={prEntries}
      trainedDays={trainedDays}
      todayKey={todayKey}
      onOpenTheme={onOpenTheme}
      statsDirection={statsDirection}
      fill={fill}
    />
  );

  // PR form wins if both linger (they never open together, but the PR one
  // outlives its close by 300ms).
  const form =
    prForRender !== null ? (
      <PRFormView
        sheet={prForRender}
        prEntries={prEntries}
        todayKey={todayKey}
        onSubmit={onSubmitPR}
        onDelete={onDeletePR}
        onClose={onClosePR}
        fill={fill}
        scrollClassName={scrollClassName}
      />
    ) : dayForRender !== null ? (
      <DayFormView
        date={dayForRender}
        prEntries={prEntries}
        trainedDays={trainedDays}
        onSelectSplit={onSelectSplit}
        onClearDay={onClearDay}
        onAddPR={onAddPR}
        onRemovePR={onRemovePR}
        onClose={onCloseSheet}
        fill={fill}
        scrollClassName={scrollClassName}
      />
    ) : null;

  const statsVisible = showStats && !showForm;

  if (fill) {
    return (
      <div className="relative h-full">
        <div
          className={[
            CARD,
            "absolute inset-0 flex flex-col p-4",
            statsVisible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0",
          ].join(" ")}
        >
          {stats}
        </div>
        <div
          className={[
            CARD,
            "absolute inset-0 flex flex-col p-4",
            showForm ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0",
          ].join(" ")}
        >
          {form}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className={[
          CARD,
          "p-4",
          statsVisible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none absolute inset-x-0 bottom-0 translate-y-4 opacity-0",
        ].join(" ")}
      >
        {stats}
      </div>
      <div
        className={[
          CARD,
          "p-4",
          showForm
            ? "translate-y-0 opacity-100"
            : "pointer-events-none absolute inset-x-0 bottom-0 translate-y-full opacity-0",
        ].join(" ")}
      >
        {form}
      </div>
    </div>
  );
}
