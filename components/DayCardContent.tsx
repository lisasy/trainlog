"use client";

import { X } from "lucide-react";
import { fullDateLabel, parseDateKey } from "@/lib/dates";
import { entriesForDate } from "@/lib/prs";
import type { DateKey, PREntry, Split, TrainedDaysMap } from "@/lib/types";
import DayForm from "./DayForm";
import PRForm, { type PRFormInput } from "./PRForm";
import { StatTiles } from "./StatsPanel";
import Button from "./ui/Button";
import IconButton from "./ui/IconButton";
import TextAction from "./ui/TextAction";

/** Shared header row for the card's form states: uppercase title + close. */
export function FormHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2">
      <h2 className="min-w-0 truncate tracking-wide text-fg uppercase">{title}</h2>
      <Button variant="ghost" size="sm" onClick={onClose}>
        close
      </Button>
    </div>
  );
}

function scrollBody(fill: boolean, scrollClassName?: string) {
  if (fill) return "mt-3 min-h-0 flex-1 overflow-y-auto";
  if (scrollClassName) return `mt-3 overflow-y-auto ${scrollClassName}`;
  return "mt-3";
}

export type StatsViewProps = {
  streakWeeks: number;
  prEntries: PREntry[];
  trainedDays: TrainedDaysMap;
  todayKey: DateKey;
  fill?: boolean;
  onOpenToday?: () => void;
  onOpenPRs?: () => void;
  variant?: "month" | "year";
  yearFocus?: number;
};

/** Resting card for month and year: 2×2 stat tiles. */
export function StatsView({
  streakWeeks,
  prEntries,
  trainedDays,
  todayKey,
  fill = false,
  onOpenToday,
  onOpenPRs,
  variant = "month",
  yearFocus,
}: StatsViewProps) {
  return (
    <div className={fill ? "flex min-h-0 flex-1 flex-col" : ""}>
      <StatTiles
        streakWeeks={streakWeeks}
        prEntries={prEntries}
        trainedDays={trainedDays}
        todayKey={todayKey}
        fill={fill}
        onOpenToday={onOpenToday}
        onOpenPRs={onOpenPRs}
        variant={variant}
        yearFocus={yearFocus}
      />
    </div>
  );
}

export type DayFormViewProps = {
  date: DateKey;
  todayKey?: DateKey;
  prEntries: PREntry[];
  trainedDays: TrainedDaysMap;
  onMarkCompleted: (date: DateKey) => void;
  onSelectSplit: (date: DateKey, split: Split) => void;
  onClearDay: (date: DateKey) => void;
  onRemovePR: (id: string) => void;
  onClose: () => void;
  /** Scroll fills the card's remaining height. */
  fill?: boolean;
  /** Height cap for the scroll region when not filling. */
  scrollClassName?: string;
  /** Phone home sheet: same header as rest, close in the corner. */
  homeChrome?: boolean;
};

/** The day editor: same body used by the phone dock and the desktop panel. */
export function DayFormView({
  date,
  todayKey,
  prEntries,
  trainedDays,
  onMarkCompleted,
  onSelectSplit,
  onClearDay,
  onRemovePR,
  onClose,
  fill = false,
  scrollClassName,
  homeChrome = false,
}: DayFormViewProps) {
  const form = (
    <DayForm
      trainedDay={trainedDays[date]}
      entries={entriesForDate(prEntries, date)}
      compact={homeChrome}
      onMarkCompleted={() => onMarkCompleted(date)}
      onSelectSplit={(split) => onSelectSplit(date, split)}
      onClearDay={() => onClearDay(date)}
      onRemovePR={onRemovePR}
    />
  );

  if (homeChrome) {
    const isToday = date === todayKey;
    const kicker = isToday
      ? "Today"
      : parseDateKey(date).toLocaleString("en-US", { weekday: "long" });

    return (
      <div className="relative flex min-h-0 flex-1 flex-col">
        <IconButton
          icon={X}
          label="Close day"
          size="sm"
          onClick={onClose}
          className="absolute top-0 left-0 z-10 hover:bg-fg/10 hover:text-fg"
        />
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
          <div className="w-full">
            <div className="text-lg font-semibold text-logged">{kicker}</div>
            <div className="mt-1 text-lg font-semibold text-fg">{fullDateLabel(date)}</div>
            <div className="sheet-body-in mt-8">{form}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <FormHeader title={fullDateLabel(date)} onClose={onClose} />
      <div className={scrollBody(fill, scrollClassName)}>{form}</div>
    </>
  );
}

export type PRSheet =
  | { mode: "add"; exerciseName?: string }
  | { mode: "edit"; id: string };

export type PRFormViewProps = {
  sheet: PRSheet;
  prEntries: PREntry[];
  todayKey: DateKey;
  onSubmit: (input: PRFormInput) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  fill?: boolean;
  scrollClassName?: string;
};

/** Add/edit a PR from the ledger — shown in the same card as everything else. */
export function PRFormView({
  sheet,
  prEntries,
  todayKey,
  onSubmit,
  onDelete,
  onClose,
  fill = false,
  scrollClassName,
}: PRFormViewProps) {
  const isEdit = sheet.mode === "edit";
  const entry = isEdit ? prEntries.find((e) => e.id === sheet.id) : undefined;

  return (
    <>
      <FormHeader title={isEdit ? "edit pr" : "add pr"} onClose={onClose} />
      <div className={scrollBody(fill, scrollClassName)}>
        <PRForm
          key={entry?.id ?? (!isEdit ? sheet.exerciseName : undefined) ?? "new"}
          allEntries={prEntries}
          todayKey={todayKey}
          initialExerciseName={entry?.exerciseName ?? (!isEdit ? sheet.exerciseName : undefined)}
          initialWeight={entry ? String(entry.weight) : undefined}
          initialNote={entry?.note}
          initialDate={entry?.date}
          submitLabel={isEdit ? "save" : "add"}
          resetAfterSubmit={!isEdit}
          autoFocus
          onSubmit={onSubmit}
        />
        {isEdit && entry ? (
          <TextAction onClick={() => onDelete(entry.id)} className="mt-5 text-sm">
            delete this pr
          </TextAction>
        ) : null}
      </div>
    </>
  );
}
