"use client";

import { dayLabel, fullDateLabel } from "@/lib/dates";
import { entriesForDate } from "@/lib/prs";
import type { DateKey, PREntry, Split, TrainedDaysMap } from "@/lib/types";
import DayForm from "./DayForm";
import PRForm, { type PRFormInput } from "./PRForm";
import StatsPanel, { StatTiles } from "./StatsPanel";
import YearHeatmap from "./YearHeatmap";

const LINK =
  "link cursor-pointer text-dim transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none";

/** Shared header row for the card's form states: `> title` + a close link. */
function FormHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex shrink-0 items-baseline justify-between gap-2">
      <span className="truncate">
        <span className="text-dim">&gt;&nbsp;</span>
        <span className="text-fg">{title}</span>
      </span>
      <button type="button" onClick={onClose} className={LINK}>
        close
      </button>
    </div>
  );
}

function scrollBody(fill: boolean, scrollClassName: string) {
  return fill ? "mt-3 min-h-0 flex-1 overflow-y-auto" : `mt-3 overflow-y-auto ${scrollClassName}`;
}

export type StatsViewProps = {
  streakWeeks: number;
  prEntries: PREntry[];
  trainedDays: TrainedDaysMap;
  todayKey: DateKey;
  /** Renders a `theme` link beside the heading when provided. */
  onOpenTheme?: () => void;
  /** Tile layout: "row" (phone dock) or "col" (narrow siderail). */
  statsDirection?: "row" | "col";
  /** Let the heatmap grow to fill the card. */
  fill?: boolean;
};

/** The "current card": today's date, the stat tiles, the year heatmap. */
export function StatsView({
  streakWeeks,
  prEntries,
  trainedDays,
  todayKey,
  onOpenTheme,
  statsDirection = "row",
  fill = false,
}: StatsViewProps) {
  const heading = (
    <>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-accent glow">Today</span>
        {onOpenTheme ? (
          <button type="button" onClick={onOpenTheme} className={LINK}>
            theme
          </button>
        ) : null}
      </div>
      <div className="mt-0.5 text-sm tracking-wide text-dim uppercase">
        {fullDateLabel(todayKey)}
      </div>
    </>
  );

  // Filling a tall column: keep the date + tiles at the top and drop the
  // heatmap to the bottom, space between.
  if (fill) {
    return (
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-6">
        <div className="shrink-0">
          {heading}
          <StatTiles
            streakWeeks={streakWeeks}
            prEntries={prEntries}
            direction={statsDirection}
            className="mt-4"
          />
        </div>
        {todayKey !== "" ? (
          <YearHeatmap
            year={Number(todayKey.slice(0, 4))}
            trainedDays={trainedDays}
            todayKey={todayKey}
            fill
          />
        ) : null}
      </div>
    );
  }

  return (
    <>
      {heading}
      <StatsPanel
        streakWeeks={streakWeeks}
        prEntries={prEntries}
        trainedDays={trainedDays}
        todayKey={todayKey}
        direction={statsDirection}
        className="mt-4"
      />
    </>
  );
}

export type DayFormViewProps = {
  date: DateKey;
  prEntries: PREntry[];
  trainedDays: TrainedDaysMap;
  onSelectSplit: (date: DateKey, split: Split) => void;
  onClearDay: (date: DateKey) => void;
  onAddPR: (date: DateKey, input: { exerciseName: string; weight: number; note?: string }) => void;
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
  onSelectSplit,
  onClearDay,
  onAddPR,
  onRemovePR,
  onClose,
  fill = false,
  scrollClassName = "max-h-[58dvh]",
}: DayFormViewProps) {
  return (
    <>
      <FormHeader title={dayLabel(date)} onClose={onClose} />
      <div className={scrollBody(fill, scrollClassName)}>
        <DayForm
          date={date}
          trainedDay={trainedDays[date]}
          entries={entriesForDate(prEntries, date)}
          allEntries={prEntries}
          onSelectSplit={(split) => onSelectSplit(date, split)}
          onClearDay={() => onClearDay(date)}
          onAddPR={(input) => onAddPR(date, input)}
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
  scrollClassName = "max-h-[58dvh]",
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
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            className="link mt-5 cursor-pointer text-sm text-dim hover:text-accent focus-visible:text-accent focus-visible:outline-none"
          >
            delete this pr
          </button>
        ) : null}
      </div>
    </>
  );
}
