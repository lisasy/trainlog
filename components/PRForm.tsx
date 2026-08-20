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
  autoFocus?: boolean;
  onSubmit: (input: PRFormInput) => void;
  onCancel?: () => void;
};

const FIELD =
  "w-full min-w-0 appearance-none rounded-none border border-border bg-transparent px-2 py-1.5 text-fg outline-none placeholder:text-dim/60 focus:border-accent";

export default function PRForm({
  allEntries,
  fixedDate,
  todayKey,
  initialExerciseName,
  autoFocus,
  onSubmit,
  onCancel,
}: PRFormProps) {
  const [exerciseName, setExerciseName] = useState(initialExerciseName ?? "");
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState<string>(fixedDate ?? todayKey ?? "");
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
    setExerciseName("");
    setWeight("");
    setNote("");
    setShowSuggestions(false);
    nameInput.current?.focus();
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
          <ul className="absolute inset-x-0 top-full z-20 max-h-48 overflow-y-auto border border-t-0 border-border bg-bg">
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
          className="cursor-pointer self-start text-sm text-dim hover:text-accent focus-visible:text-accent focus-visible:outline-none"
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

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canAdd}
          className="cursor-pointer border border-border px-2 py-1.5 text-fg hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:border-border disabled:text-dim/50 disabled:hover:text-dim/50"
        >
          [ add ]
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer border border-border px-2 py-1.5 text-dim hover:border-accent hover:text-accent"
          >
            [ done ]
          </button>
        ) : null}
      </div>
    </div>
  );
}
