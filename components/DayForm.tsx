"use client";

import { X } from "lucide-react";
import { SPLITS, type DateKey, type PREntry, type Split, type TrainedDay } from "@/lib/types";
import PRForm from "./PRForm";

export type DayFormProps = {
  date: DateKey;
  trainedDay?: TrainedDay;
  entries: PREntry[];
  allEntries: PREntry[];
  onSelectSplit: (split: Split) => void;
  onClearDay: () => void;
  onAddPR: (input: { exerciseName: string; weight: number; note?: string }) => void;
  onRemovePR: (id: string) => void;
};

const LABEL = "text-sm tracking-wide text-dim uppercase";

/** The body of the day editor — shared by the phone dock and the desktop panel. */
export default function DayForm({
  date,
  trainedDay,
  entries,
  allEntries,
  onSelectSplit,
  onClearDay,
  onAddPR,
  onRemovePR,
}: DayFormProps) {
  const isTrained = trainedDay !== undefined;

  return (
    <div>
      <div className={LABEL}>split</div>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {SPLITS.map((split) => {
          const active = trainedDay?.split === split;
          return (
            <button
              key={split}
              type="button"
              onClick={() => onSelectSplit(split)}
              aria-pressed={active}
              className={[
                "rounded-lg border px-1 py-2.5 text-sm uppercase transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
                active ? "border-accent text-accent" : "border-border text-dim hover:text-accent",
              ].join(" ")}
            >
              {split}
            </button>
          );
        })}
      </div>
      {isTrained ? (
        <button
          type="button"
          onClick={onClearDay}
          className="link mt-2 cursor-pointer text-sm text-dim hover:text-accent focus-visible:text-accent focus-visible:outline-none"
        >
          clear this day
        </button>
      ) : (
        <p className="mt-2 text-sm text-dim">pick a split to log this day</p>
      )}

      <div className={`${LABEL} mt-5`}>prs</div>
      {entries.length === 0 ? (
        <p className="mt-2 text-sm text-dim">none attached to this day</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-baseline gap-2 rounded-lg bg-bg/40 px-2.5 py-2"
            >
              <span className="min-w-0 flex-1 truncate">{entry.exerciseName}</span>
              <span className="shrink-0 text-accent">
                {entry.weight}
                <span className="text-sm text-dim"> lbs</span>
              </span>
              {entry.note ? (
                <span className="min-w-0 max-w-[40%] truncate text-sm text-dim">{entry.note}</span>
              ) : null}
              <button
                type="button"
                onClick={() => onRemovePR(entry.id)}
                aria-label={`Remove ${entry.exerciseName}`}
                className="shrink-0 cursor-pointer text-dim hover:text-accent focus-visible:text-accent focus-visible:outline-none"
              >
                <X size={14} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={`${LABEL} mt-5`}>add pr</div>
      <div className="mt-2">
        <PRForm
          allEntries={allEntries}
          fixedDate={date}
          onSubmit={({ exerciseName, weight, note }) => onAddPR({ exerciseName, weight, note })}
        />
      </div>
    </div>
  );
}
