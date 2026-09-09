"use client";

import { useMemo, useState } from "react";
import { Dot, Plus } from "lucide-react";
import { groupByExercise } from "@/lib/prs";
import {
  exerciseInCategory,
  PR_CATEGORIES,
  PR_CATEGORY_LABELS,
  prCardDate,
  type PRCategory,
} from "@/lib/prCategories";
import { FOCUS_RING, PRESSABLE, SECTION_LABEL } from "@/lib/styles";
import type { PREntry } from "@/lib/types";
import Button from "./ui/Button";
import IconButton from "./ui/IconButton";
import Weight from "./ui/Weight";

export type PRListProps = {
  entries: PREntry[];
  onAddPR: (exerciseName?: string) => void;
  onEditPR: (entry: PREntry) => void;
};

/** Shared column widths, so every row's date and weight line up exactly. */
const MARKER = "w-[1.5ch] shrink-0";
const DATE = "w-[10ch] shrink-0";
const WEIGHT = "w-[8ch] shrink-0";

/**
 * PR screen: recent wins, muscle-group chips, then the ledger.
 * Page title lives in AppHeader.
 */
export default function PRList({ entries, onAddPR, onEditPR }: PRListProps) {
  const [category, setCategory] = useState<PRCategory>("all");
  const groups = useMemo(() => groupByExercise(entries), [entries]);
  const visible = useMemo(
    () => groups.filter((group) => exerciseInCategory(group.exerciseName, category)),
    [groups, category],
  );
  const wins = groups.filter((group) => group.current.date !== "").slice(0, 8);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {wins.length > 0 ? (
        <section className="shrink-0" aria-label="Recent wins">
          <div className={SECTION_LABEL}>Recent wins</div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {wins.map((group) => (
              <button
                key={group.current.id}
                type="button"
                onClick={() => onEditPR(group.current)}
                className={[
                  "w-[10.5rem] shrink-0 rounded-xl bg-surface p-3 text-left",
                  PRESSABLE,
                  "hover:bg-fg/10",
                  FOCUS_RING,
                ].join(" ")}
              >
                <div className="flex items-baseline justify-between gap-2 text-sm text-dim uppercase">
                  <span className="min-w-0 truncate">{group.exerciseName}</span>
                  <span className="shrink-0">{prCardDate(group.current.date)}</span>
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-accent">{group.current.weight}</span>
                  <span className="text-sm text-dim">lbs</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-4 flex shrink-0 gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PR_CATEGORIES.map((id) => {
          const active = category === id;
          return (
            <Button
              key={id}
              size="sm"
              pressed={active}
              onClick={() => setCategory(id)}
              className="uppercase"
            >
              {PR_CATEGORY_LABELS[id]}
            </Button>
          );
        })}
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        <div className="mb-5">
          <Button variant="quiet" size="sm" onClick={() => onAddPR()}>
            <Plus size={16} aria-hidden />
            add pr
          </Button>
        </div>

        {visible.length === 0 ? (
          <div className="text-dim">
            <p>{groups.length === 0 ? "no prs yet." : "nothing in this group."}</p>
            {groups.length === 0 ? (
              <p className="mt-1 text-sm">add one above.</p>
            ) : null}
          </div>
        ) : (
          visible.map((group) => (
            <section key={group.exerciseName.toLowerCase()} className="mb-6">
              <div className="flex items-baseline justify-between gap-3 border-b border-dotted border-border pb-1">
                <h2 className="min-w-0 truncate text-fg">{group.exerciseName}</h2>
                <span className="flex shrink-0 items-baseline gap-3 text-dim">
                  <span>
                    <span className="text-sm">current&nbsp;</span>
                    <Weight value={group.current.weight} />
                  </span>
                  <IconButton
                    icon={Plus}
                    label={`Add a ${group.exerciseName} pr`}
                    size="sm"
                    onClick={() => onAddPR(group.exerciseName)}
                    className="-my-1"
                  />
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
                          "flex w-full items-baseline gap-3 px-1 py-1.5 text-left",
                          PRESSABLE,
                          "border-b border-dotted border-border hover:bg-fg/5",
                          isCurrent ? "bg-fg/5" : "",
                        ].join(" ")}
                      >
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
    </div>
  );
}
