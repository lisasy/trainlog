"use client";

import { Dot } from "lucide-react";
import { groupByExercise } from "@/lib/prs";
import type { PREntry } from "@/lib/types";

export type PRListProps = {
  entries: PREntry[];
  onAddPR: (exerciseName?: string) => void;
  onEditPR: (entry: PREntry) => void;
};

/** Shared column widths, so every row's date and weight line up exactly. */
const MARKER = "w-[1.5ch] shrink-0";
const DATE = "w-[10ch] shrink-0";
const WEIGHT = "w-[8ch] shrink-0";

function Weight({ value, muted }: { value: number; muted?: boolean }) {
  return (
    <>
      <span className={muted ? "text-fg/90" : "text-logged"}>{value}</span>
      <span className="text-sm text-dim"> lbs</span>
    </>
  );
}

/**
 * The PR ledger: one group per exercise, newest first, current lift at the top
 * of its group — the same shape as the notes-app log this replaces.
 */
export default function PRList({ entries, onAddPR, onEditPR }: PRListProps) {
  const groups = groupByExercise(entries);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto pb-[16dvh] lg:pb-0">
      <div className="mb-5">
        <button
          type="button"
          onClick={() => onAddPR()}
          className="cursor-pointer rounded-lg border border-border px-3 py-2 text-dim transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
        >
          + add pr
        </button>
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
                  <Weight value={group.current.weight} />
                </span>
                <button
                  type="button"
                  onClick={() => onAddPR(group.exerciseName)}
                  aria-label={`Add a ${group.exerciseName} pr`}
                  className="cursor-pointer text-lg leading-none text-dim transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
                >
                  +
                </button>
              </span>
            </div>

            <ul>
              {group.entries.map((entry) => {
                const isCurrent = entry.id === group.current.id;
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => onEditPR(entry)}
                      aria-label={`Edit ${entry.exerciseName} ${entry.weight} lbs`}
                      className={[
                        "flex w-full cursor-pointer items-baseline gap-3 px-1 py-1.5 text-left",
                        "border-b border-dotted border-border hover:bg-fg/5",
                        isCurrent ? "bg-fg/5" : "",
                      ].join(" ")}
                    >
                      {/* Empty when not current — the marker still occupies
                          its column via MARKER, so the dates stay aligned. */}
                      <span
                        className={`${MARKER} inline-flex items-center ${isCurrent ? "text-logged" : "text-dim/50"}`}
                        aria-hidden
                      >
                        {isCurrent ? <Dot size={16} /> : null}
                      </span>
                      <span className={`${DATE} text-dim`}>
                        {entry.date === "" ? "—" : entry.date}
                      </span>
                      <span className={WEIGHT}>
                        <Weight value={entry.weight} muted={!isCurrent} />
                      </span>
                      {entry.note ? (
                        <span className="min-w-0 flex-1 truncate text-sm text-dim">
                          {entry.note}
                        </span>
                      ) : null}
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
