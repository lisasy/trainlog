"use client";

import { useEffect, useMemo, useState } from "react";
import { dayLabel } from "@/lib/dates";
import { suggestExercises } from "@/lib/prs";
import { SPLITS, type DateKey, type PREntry, type Split, type TrainedDay } from "@/lib/types";

export type DayDetailSheetProps = {
  date: DateKey;
  trainedDay?: TrainedDay;
  /** PR entries already attached to this date. */
  entries: PREntry[];
  /** Every entry, for autocomplete across the whole log. */
  allEntries: PREntry[];
  onSelectSplit: (split: Split) => void;
  onClearDay: () => void;
  onAddPR: (input: { exerciseName: string; weight: number; note?: string }) => void;
  onRemovePR: (id: string) => void;
  onClose: () => void;
};

export default function DayDetailSheet({
  date,
  trainedDay,
  entries,
  allEntries,
  onSelectSplit,
  onClearDay,
  onAddPR,
  onRemovePR,
  onClose,
}: DayDetailSheetProps) {
  const [exerciseName, setExerciseName] = useState("");
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const suggestions = useMemo(
    () => suggestExercises(allEntries, exerciseName),
    [allEntries, exerciseName],
  );

  const parsedWeight = Number.parseFloat(weight);
  const canAdd = exerciseName.trim() !== "" && Number.isFinite(parsedWeight) && parsedWeight > 0;

  function handleAdd() {
    if (!canAdd) return;
    onAddPR({ exerciseName, weight: parsedWeight, note });
    setExerciseName("");
    setWeight("");
    setNote("");
    setShowSuggestions(false);
  }

  const fieldClass =
    "w-full min-w-0 appearance-none rounded-none border border-border bg-transparent px-2 py-1.5 text-fg outline-none placeholder:text-dim/60 focus:border-accent";

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} aria-hidden />

      {/* Bottom sheet on phones, right-hand drawer alongside the sidebar on
          desktop — the layout already reads as panes, so a drawer fits it. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${date}`}
        className={[
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col border-t border-border bg-bg",
          "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          "lg:inset-y-0 lg:right-0 lg:left-auto lg:max-h-none lg:w-[24rem] lg:border-t-0 lg:border-l lg:pb-0",
        ].join(" ")}
      >
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-dotted border-border px-3">
          <span>
            <span className="text-dim">&gt;&nbsp;</span>
            <span className="text-fg">{dayLabel(date)}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-dim hover:text-accent focus-visible:text-accent focus-visible:outline-none"
          >
            [ esc ]
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <div className="text-sm text-dim">split</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {SPLITS.map((split) => {
              const isCurrent = trainedDay?.split === split;
              return (
                <button
                  key={split}
                  type="button"
                  onClick={() => onSelectSplit(split)}
                  aria-pressed={isCurrent}
                  className={[
                    "cursor-pointer border px-2 py-1.5 focus-visible:outline-none",
                    isCurrent
                      ? "border-border bg-fg/10 text-accent"
                      : "border-transparent text-fg/60 hover:bg-fg/5",
                  ].join(" ")}
                >
                  <span aria-hidden>[ </span>
                  {split}
                  <span aria-hidden> ]</span>
                </button>
              );
            })}
          </div>

          {trainedDay ? (
            <button
              type="button"
              onClick={onClearDay}
              className="mt-2 cursor-pointer text-sm text-dim hover:text-accent focus-visible:text-accent focus-visible:outline-none"
            >
              clear this day
            </button>
          ) : (
            <p className="mt-2 text-sm text-dim">not marked — pick a split to log it</p>
          )}

          <div className="mt-5 text-sm text-dim">prs</div>
          {entries.length === 0 ? (
            <p className="mt-1 text-sm text-dim/70">none attached to this day</p>
          ) : (
            <ul className="mt-1">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-baseline gap-2 border-b border-dotted border-border py-1.5"
                >
                  <span className="min-w-0 flex-1 truncate">{entry.exerciseName}</span>
                  <span className="text-accent">{entry.weight}</span>
                  {entry.note ? (
                    <span className="min-w-0 max-w-[45%] truncate text-sm text-dim">
                      {entry.note}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onRemovePR(entry.id)}
                    aria-label={`Remove ${entry.exerciseName}`}
                    className="cursor-pointer text-dim hover:text-accent focus-visible:text-accent focus-visible:outline-none"
                  >
                    [x]
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 text-sm text-dim">+ add pr</div>
          <div className="mt-1 flex flex-col gap-2">
            <div className="relative">
              <input
                type="text"
                value={exerciseName}
                onChange={(event) => {
                  setExerciseName(event.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                // A click on a suggestion has to land before the list closes.
                onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
                placeholder="exercise"
                aria-label="Exercise name"
                autoComplete="off"
                className={fieldClass}
              />
              {showSuggestions && suggestions.length > 0 ? (
                <ul className="absolute inset-x-0 top-full z-10 border border-t-0 border-border bg-bg">
                  {suggestions.map((name) => (
                    <li key={name}>
                      <button
                        type="button"
                        onClick={() => {
                          setExerciseName(name);
                          setShowSuggestions(false);
                        }}
                        className="w-full cursor-pointer px-2 py-1.5 text-left text-fg/80 hover:bg-fg/10"
                      >
                        {name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <input
              type="text"
              inputMode="decimal"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              placeholder="weight"
              aria-label="Weight"
              className={fieldClass}
            />

            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="note (optional)"
              aria-label="Note"
              className={fieldClass}
            />

            <button
              type="button"
              onClick={handleAdd}
              disabled={!canAdd}
              className="cursor-pointer border border-border px-2 py-1.5 text-fg hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:border-border disabled:text-dim/50 disabled:hover:text-dim/50"
            >
              [ add ]
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
