"use client";

import type { DateKey, PREntry, Split, TrainedDaysMap } from "@/lib/types";
import CurrentCard from "./CurrentCard";
import type { PRSheet } from "./DayCardContent";
import type { PRFormInput } from "./PRForm";

export type RightRailProps = {
  streakWeeks: number;
  prEntries: PREntry[];
  trainedDays: TrainedDaysMap;
  todayKey: DateKey;
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
 * Desktop siderail. Holds the same floating card as the phone dock — today's
 * stats, swapping to the day editor or the PR form on demand — sized to fill
 * the column.
 */
export default function RightRail(props: RightRailProps) {
  return (
    <aside className="hidden w-[23rem] shrink-0 flex-col p-3 lg:flex">
      <CurrentCard fill statsDirection="col" {...props} />
    </aside>
  );
}
