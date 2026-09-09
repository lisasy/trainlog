"use client";

import { X } from "lucide-react";
import { SECTION_LABEL } from "@/lib/styles";
import { SPLITS, type PREntry, type Split, type TrainedDay } from "@/lib/types";
import Button from "./ui/Button";
import IconButton from "./ui/IconButton";
import Weight from "./ui/Weight";

export type DayFormProps = {
  trainedDay?: TrainedDay;
  entries: PREntry[];
  onMarkCompleted: () => void;
  onSelectSplit: (split: Split) => void;
  onClearDay: () => void;
  onRemovePR: (id: string) => void;
};

/** The body of the day editor — shared by the phone dock and the desktop panel. */
export default function DayForm({
  trainedDay,
  entries,
  onMarkCompleted,
  onSelectSplit,
  onClearDay,
  onRemovePR,
}: DayFormProps) {
  const isTrained = trainedDay !== undefined;

  return (
    <div>
      <Button
        variant={isTrained ? "quiet" : "primary"}
        pressed={isTrained}
        onClick={isTrained ? onClearDay : onMarkCompleted}
        className="w-full"
      >
        {isTrained ? "Completed" : "Mark Completed"}
      </Button>

      {isTrained ? (
        <>
          <div className={`${SECTION_LABEL} mt-5`}>split</div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {SPLITS.map((split) => {
              const active = trainedDay?.split === split;
              return (
                <Button
                  key={split}
                  size="sm"
                  pressed={active}
                  onClick={() => onSelectSplit(split)}
                  className="w-full uppercase"
                >
                  {split}
                </Button>
              );
            })}
          </div>
        </>
      ) : null}

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
    </div>
  );
}
