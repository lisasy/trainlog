"use client";

import { useState } from "react";
import { groupByExercise } from "@/lib/prs";
import type { DateKey, PREntry } from "@/lib/types";
import PRForm, { type PRFormInput } from "./PRForm";

export type PRListProps = {
  entries: PREntry[];
  todayKey: DateKey;
  /** Jump the calendar to the day an entry is attached to. */
  onOpenDate: (date: DateKey) => void;
  onAddPR: (input: PRFormInput) => void;
  onRemovePR: (id: string) => void;
};

/**
 * The PR ledger: one group per exercise, newest first, current lift at the top
 * of its group — the same shape as the notes-app log this replaces.
 *
 * PRs can be added here directly, with or without a date; nothing about
 * recording a lift requires going through the calendar.
 */
export default function PRList({
  entries,
  todayKey,
  onOpenDate,
  onAddPR,
  onRemovePR,
}: PRListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [prefill, setPrefill] = useState<string | undefined>(undefined);
  const groups = groupByExercise(entries);

  function openForm(exerciseName?: string) {
    setPrefill(exerciseName);
    setFormOpen(true);
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mb-5">
        {formOpen ? (
          <div className="border border-dotted border-border p-3">
            <div className="mb-2 text-sm text-dim">
              {prefill ? `add to ${prefill}` : "add pr"}
            </div>
            <PRForm
              key={prefill ?? "new"}
              allEntries={entries}
              todayKey={todayKey}
              initialExerciseName={prefill}
              autoFocus
              onSubmit={onAddPR}
              onCancel={() => {
                setFormOpen(false);
                setPrefill(undefined);
              }}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => openForm()}
            className="cursor-pointer text-dim hover:text-accent focus-visible:text-accent focus-visible:outline-none"
          >
            [ + add pr ]
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="text-dim">
          <p>no prs yet.</p>
          <p className="mt-1 text-sm">add one above, or attach one to a day from the calendar.</p>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.exerciseName.toLowerCase()} className="mb-6">
            <div className="flex items-baseline justify-between gap-3 border-b border-dotted border-border pb-1">
              <h2 className="min-w-0 truncate text-fg">{group.exerciseName}</h2>
              <span className="flex shrink-0 items-baseline gap-3 text-dim">
                <span>
                  <span className="text-sm">current&nbsp;</span>
                  <span className="text-logged">{group.current.weight}</span>
                </span>
                <button
                  type="button"
                  onClick={() => openForm(group.exerciseName)}
                  aria-label={`Add a ${group.exerciseName} pr`}
                  className="cursor-pointer hover:text-accent focus-visible:text-accent focus-visible:outline-none"
                >
                  [+]
                </button>
              </span>
            </div>

            <ul>
              {group.entries.map((entry) => {
                const isCurrent = entry.id === group.current.id;
                const isUndated = entry.date === "";
                return (
                  <li
                    key={entry.id}
                    className={[
                      "flex items-baseline gap-3 border-b border-dotted border-border px-1",
                      isCurrent ? "bg-fg/5" : "",
                    ].join(" ")}
                  >
                    <span className={isCurrent ? "text-logged" : "text-dim/50"} aria-hidden>
                      {isCurrent ? "▪" : " "}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isUndated) onOpenDate(entry.date);
                      }}
                      disabled={isUndated}
                      title={isUndated ? "no date recorded" : "open this day"}
                      className={[
                        "flex min-w-0 flex-1 items-baseline gap-3 py-1.5 text-left",
                        isUndated ? "cursor-default" : "cursor-pointer hover:text-accent",
                      ].join(" ")}
                    >
                      <span className="w-[10ch] shrink-0 text-dim">
                        {isUndated ? "—" : entry.date}
                      </span>
                      <span className={`shrink-0 ${isCurrent ? "text-logged" : "text-fg/70"}`}>
                        {entry.weight}
                      </span>
                      {entry.note ? (
                        <span className="min-w-0 flex-1 truncate text-sm text-dim">
                          {entry.note}
                        </span>
                      ) : null}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemovePR(entry.id)}
                      aria-label={`Remove ${entry.exerciseName} ${entry.weight}`}
                      className="cursor-pointer py-1.5 text-dim hover:text-accent focus-visible:text-accent focus-visible:outline-none"
                    >
                      [x]
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
