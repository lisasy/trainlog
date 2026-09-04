"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { suggestExercises } from "@/lib/prs";
import type { DateKey, PREntry } from "@/lib/types";

export type PRFormInput = {
  exerciseName: string;
  weight: number;
  date: DateKey;
  note?: string;
};

export type PRFormProps = {
  /** Autocomplete source — every entry in the log. */
  allEntries: PREntry[];
  /**
   * When set, the entry belongs to this day and the date field is hidden.
   * The day sheet passes it; the ledger doesn't and shows a date picker.
   */
  fixedDate?: DateKey;
  /** Today, used as the ledger form's default date. */
  todayKey?: DateKey;
  initialExerciseName?: string;
  initialWeight?: string;
  initialNote?: string;
  initialDate?: string;
  submitLabel?: string;
  /** Add forms clear for the next entry; edit forms keep what was typed. */
  resetAfterSubmit?: boolean;
  autoFocus?: boolean;
  onSubmit: (input: PRFormInput) => void;
  onCancel?: () => void;
};

const FIELD =
  "w-full min-w-0 appearance-none rounded-lg border border-border bg-bg/40 px-3 py-2 text-fg outline-none transition-colors placeholder:text-dim focus:border-accent";

const PRIMARY =
  "cursor-pointer rounded-lg border border-accent px-4 py-2 text-accent transition-colors hover:bg-accent hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent disabled:cursor-not-allowed disabled:border-border disabled:text-dim/40 disabled:hover:bg-transparent disabled:hover:text-dim/40";

const GHOST =
  "cursor-pointer rounded-lg border border-transparent px-4 py-2 text-dim transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent";

export default function PRForm({
  allEntries,
  fixedDate,
  todayKey,
  initialExerciseName,
  initialWeight,
  initialNote,
  initialDate,
  submitLabel = "add",
  resetAfterSubmit = true,
  autoFocus,
  onSubmit,
  onCancel,
}: PRFormProps) {
  const [exerciseName, setExerciseName] = useState(initialExerciseName ?? "");
  const [weight, setWeight] = useState(initialWeight ?? "");
  const [note, setNote] = useState(initialNote ?? "");
  const [date, setDate] = useState<string>(initialDate ?? fixedDate ?? todayKey ?? "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) nameInput.current?.focus();
  }, [autoFocus]);

  const suggestions = useMemo(
    () => suggestExercises(allEntries, exerciseName),
    [allEntries, exerciseName],
  );

  const parsedWeight = Number.parseFloat(weight);
  const canAdd = exerciseName.trim() !== "" && Number.isFinite(parsedWeight) && parsedWeight > 0;

  function handleSubmit() {
    if (!canAdd) return;
    onSubmit({
      exerciseName,
      weight: parsedWeight,
      // An empty date is the "undated" case the source log already has.
      date: fixedDate ?? date,
      note,
    });
    if (resetAfterSubmit) {
      setExerciseName("");
      setWeight("");
      setNote("");
      setShowSuggestions(false);
      nameInput.current?.focus();
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <input
          ref={nameInput}
          type="text"
          value={exerciseName}
          onChange={(event) => {
            setExerciseName(event.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          // A click on a suggestion has to land before the list closes.
          onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSubmit();
          }}
          placeholder="exercise"
          aria-label="Exercise name"
          autoComplete="off"
          className={FIELD}
        />
        {showSuggestions && suggestions.length > 0 ? (
          <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-bg">
            {suggestions.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => {
                    setExerciseName(name);
                    setShowSuggestions(false);
                  }}
                  className="w-full cursor-pointer px-3 py-2 text-left text-fg/90 hover:bg-fg/10"
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSubmit();
          }}
          placeholder="weight"
          aria-label="Weight"
          className={FIELD}
        />

        {fixedDate === undefined ? (
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            aria-label="Date"
            // Native picker on phones; dark so it matches the rest.
            style={{ colorScheme: "dark" }}
            className={FIELD}
          />
        ) : null}
      </div>

      {fixedDate === undefined && date !== "" ? (
        <button
          type="button"
          onClick={() => setDate("")}
          className="link cursor-pointer self-start text-sm text-dim hover:text-accent focus-visible:text-accent focus-visible:outline-none"
        >
          clear date (undated)
        </button>
      ) : null}

      <input
        type="text"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") handleSubmit();
        }}
        placeholder="note (optional)"
        aria-label="Note"
        className={FIELD}
      />

      <div className="mt-1 flex gap-2">
        <button type="button" onClick={handleSubmit} disabled={!canAdd} className={PRIMARY}>
          {submitLabel}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className={GHOST}>
            done
          </button>
        ) : null}
      </div>
    </div>
  );
}
