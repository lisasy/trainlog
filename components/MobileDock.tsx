"use client";

import type { DateKey, PREntry, Split, TrainedDaysMap } from "@/lib/types";
import type { View } from "@/lib/views";
import BottomNav from "./BottomNav";
import CurrentCard from "./CurrentCard";
import type { PRSheet } from "./DayCardContent";
import type { PRFormInput } from "./PRForm";

export type MobileDockProps = {
  /** Calendar view rests on the stats card; other views only get the nav. */
  calendarView: boolean;
  streakWeeks: number;
  prEntries: PREntry[];
  trainedDays: TrainedDaysMap;
  todayKey: DateKey;
  onOpenTheme: () => void;
  view: View;
  onSelectView: (view: View) => void;
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
};

/**
 * The phone's stats + navigation, floating over a full-bleed calendar. A
 * blurred gradient veil sits behind it so the calendar reads clearly above
 * the dock and dissolves into frost beneath it.
 */
export default function MobileDock({
  calendarView,
  streakWeeks,
  prEntries,
  trainedDays,
  todayKey,
  onOpenTheme,
  view,
  onSelectView,
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
}: MobileDockProps) {
  // The card shows for the calendar's stats, or any time a form is open.
  const cardActive = calendarView || prSheet !== null || sheetDate !== null;

  return (
    <div
      className={[
        "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col justify-end lg:hidden",
        cardActive ? "pt-[16dvh]" : "pt-[6dvh]",
      ].join(" ")}
    >
      <div aria-hidden className="dock-veil pointer-events-none absolute inset-0" />

      <div className="pointer-events-auto relative px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <CurrentCard
          showStats={calendarView}
          streakWeeks={streakWeeks}
          prEntries={prEntries}
          trainedDays={trainedDays}
          todayKey={todayKey}
          onOpenTheme={onOpenTheme}
          sheetDate={sheetDate}
          onSelectSplit={onSelectSplit}
          onClearDay={onClearDay}
          onAddPR={onAddPR}
          onRemovePR={onRemovePR}
          onCloseSheet={onCloseSheet}
          prSheet={prSheet}
          onSubmitPR={onSubmitPR}
          onDeletePR={onDeletePR}
          onClosePR={onClosePR}
          scrollClassName="max-h-[58dvh]"
        />

        <BottomNav view={view} onSelectView={onSelectView} />
      </div>
    </div>
  );
}
