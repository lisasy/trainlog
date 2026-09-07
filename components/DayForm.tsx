"use client";

import { X } from "lucide-react";
import { FOCUS_RING, SECTION_LABEL } from "@/lib/styles";
import { SPLITS, type DateKey, type PREntry, type Split, type TrainedDay } from "@/lib/types";
import PRForm from "./PRForm";
import IconButton from "./ui/IconButton";
import TextAction from "./ui/TextAction";
import Weight from "./ui/Weight";

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
      <div className={SECTION_LABEL}>split</div>
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
                FOCUS_RING,
                active ? "border-accent text-accent" : "border-border text-dim hover:text-accent",
              ].join(" ")}
            >
              {split}
            </button>
          );
        })}
      </div>
      {isTrained ? (
        <TextAction onClick={onClearDay} className="mt-2 text-sm">
          clear this day
        </TextAction>
      ) : (
        <p className="mt-2 text-sm text-dim">pick a split to log this day</p>
      )}

      <div className={`${SECTION_LABEL} mt-5`}>prs</div>
      {entries.length === 0 ? (
        <p className="mt-2 text-sm text-dim">none attached to this day</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-2 rounded-lg bg-bg/40 px-2.5 py-1.5"
            >
              <span className="min-w-0 flex-1 truncate">{entry.exerciseName}</span>
              <span className="shrink-0">
                <Weight value={entry.weight} />
              </span>
              {entry.note ? (
                <span className="min-w-0 max-w-[40%] truncate text-sm text-dim">{entry.note}</span>
              ) : null}
              <IconButton
                icon={X}
                label={`Remove ${entry.exerciseName}`}
                size="sm"
                onClick={() => onRemovePR(entry.id)}
                className="-my-1 -mr-1.5"
              />
            </li>
          ))}
        </ul>
      )}

      <div className={`${SECTION_LABEL} mt-5`}>add pr</div>
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
