"use client";

import { groupByExercise } from "@/lib/prs";
import type { PREntry } from "@/lib/types";

export type PRListProps = {
  entries: PREntry[];
  /** Jump the calendar to the day an entry is attached to. */
  onOpenDate: (date: string) => void;
};

/**
 * The PR ledger: one group per exercise, newest first, current lift at the top
 * of its group — the same shape as the notes-app log this replaces.
 */
export default function PRList({ entries, onOpenDate }: PRListProps) {
  const groups = groupByExercise(entries);

  if (groups.length === 0) {
    return (
      <div className="py-6 text-dim">
        <p>no prs yet.</p>
        <p className="mt-1 text-sm">open a day and attach one to get started.</p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {groups.map((group) => (
        <section key={group.exerciseName.toLowerCase()} className="mb-6">
          <div className="flex items-baseline justify-between border-b border-dotted border-border pb-1">
            <h2 className="min-w-0 truncate text-fg">{group.exerciseName}</h2>
            <span className="shrink-0 text-dim">
              <span className="text-sm">current&nbsp;</span>
              <span className="text-logged">{group.current.weight}</span>
            </span>
          </div>

          <ul>
            {group.entries.map((entry) => {
              const isCurrent = entry.id === group.current.id;
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => onOpenDate(entry.date)}
                    className={[
                      "flex w-full cursor-pointer items-baseline gap-3 px-1 py-1.5 text-left",
                      "border-b border-dotted border-border hover:bg-fg/5",
                      isCurrent ? "bg-fg/5" : "",
                    ].join(" ")}
                  >
                    <span className={isCurrent ? "text-logged" : "text-dim/50"} aria-hidden>
                      {isCurrent ? "▪" : " "}
                    </span>
                    <span className="shrink-0 text-dim">{entry.date}</span>
                    <span className={`shrink-0 ${isCurrent ? "text-logged" : "text-fg/70"}`}>
                      {entry.weight}
                    </span>
                    {entry.note ? (
                      <span className="min-w-0 flex-1 truncate text-sm text-dim">{entry.note}</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
