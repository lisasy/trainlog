"use client";

import { fullDateLabel } from "@/lib/dates";
import { entriesForDate } from "@/lib/prs";
import type { DateKey, PREntry, Split, TrainedDaysMap } from "@/lib/types";
import DayForm from "./DayForm";
import PRForm, { type PRFormInput } from "./PRForm";
import { StatTiles } from "./StatsPanel";
import Button from "./ui/Button";
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
  todayKey: DateKey;
  /** Renders a `theme` link beside the heading when provided. */
  onOpenTheme?: () => void;
  /** Tile layout: "row" (phone dock) or "col" (narrow siderail). */
  statsDirection?: "row" | "col";
  fill?: boolean;
};

/** The "current card": today's date and the stat tiles. */
export function StatsView({
  streakWeeks,
  prEntries,
  todayKey,
  onOpenTheme,
  statsDirection = "row",
  fill = false,
}: StatsViewProps) {
  const heading = (
    <>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-accent glow">Today</span>
        {onOpenTheme ? <TextAction onClick={onOpenTheme}>theme</TextAction> : null}
      </div>
      <div className="mt-0.5 text-sm tracking-wide text-dim uppercase">
        {fullDateLabel(todayKey)}
      </div>
    </>
  );

  return (
    <div className={fill ? "flex min-h-0 flex-1 flex-col" : ""}>
      {heading}
      <StatTiles
        streakWeeks={streakWeeks}
        prEntries={prEntries}
        direction={statsDirection}
        className="mt-4"
      />
    </div>
  );
}

export type DayFormViewProps = {
  date: DateKey;
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
};

/** The day editor: same body used by the phone dock and the desktop siderail. */
export function DayFormView({
  date,
  prEntries,
  trainedDays,
  onMarkCompleted,
  onSelectSplit,
  onClearDay,
  onRemovePR,
  onClose,
  fill = false,
  scrollClassName,
}: DayFormViewProps) {
  return (
    <>
      <FormHeader title={fullDateLabel(date)} onClose={onClose} />
      <div className={scrollBody(fill, scrollClassName)}>
        <DayForm
          trainedDay={trainedDays[date]}
          entries={entriesForDate(prEntries, date)}
          onMarkCompleted={() => onMarkCompleted(date)}
          onSelectSplit={(split) => onSelectSplit(date, split)}
          onClearDay={() => onClearDay(date)}
          onRemovePR={onRemovePR}
        />
      </div>
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
