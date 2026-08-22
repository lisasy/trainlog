"use client";

import { WEEKDAY_LABELS } from "@/lib/dates";
import { groupByExercise } from "@/lib/prs";
import type { PREntry } from "@/lib/types";
import StreakBadge from "./StreakBadge";

export type StatsPanelProps = {
  streakWeeks: number;
  /** Weekday trained most often, Sunday-indexed. */
  topWeekday: { index: number; count: number } | null;
  averagePerMonth: number | null;
  prEntries: PREntry[];
  onEditPR: (entry: PREntry) => void;
  onAddPR: () => void;
  onViewAllPRs: () => void;
};

/** How many exercises to show before "view all" takes over. */
const RECENT_LIMIT = 5;

/**
 * Mobile-only bottom panel: the same streak and PR snapshot the desktop
 * sidebar shows, always visible below the calendar rather than tucked behind
 * a tap. `groupByExercise` already sorts newest-current-first, so slicing it
 * is exactly "most recently touched exercises".
 */
export default function StatsPanel({
  streakWeeks,
  topWeekday,
  averagePerMonth,
  prEntries,
  onEditPR,
  onAddPR,
  onViewAllPRs,
}: StatsPanelProps) {
  const groups = groupByExercise(prEntries);
  const recent = groups.slice(0, RECENT_LIMIT);

  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto border-t border-dotted border-border pt-2 lg:hidden">
      <div className="px-1 text-dim">stats</div>
      <div className="mt-1">
        <StreakBadge weeks={streakWeeks} variant="block" />
        <div className="flex items-baseline justify-between px-2">
          <span className="text-dim">most popular</span>
          <span className="text-fg/90">
            {topWeekday === null ? "~" : WEEKDAY_LABELS[topWeekday.index]}
          </span>
        </div>
        <div className="flex items-baseline justify-between px-2">
          <span className="text-dim">avg / month</span>
          <span className="text-fg/90">
            {averagePerMonth === null ? "~" : averagePerMonth.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between px-1">
        <span className="text-dim">prs</span>
        {groups.length > RECENT_LIMIT ? (
          <button
            type="button"
            onClick={onViewAllPRs}
            className="link cursor-pointer text-dim transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
          >
            view all
          </button>
        ) : null}
      </div>

      {recent.length === 0 ? (
        <p className="mt-1 px-1 text-sm text-dim">no prs yet.</p>
      ) : (
        <ul className="mt-1">
          {recent.map((group) => (
            <li key={group.exerciseName.toLowerCase()}>
              <button
                type="button"
                onClick={() => onEditPR(group.current)}
                aria-label={`Edit ${group.exerciseName} ${group.current.weight} lbs`}
                className="flex w-full cursor-pointer items-baseline justify-between gap-3 border-b border-dotted border-border px-1 py-1.5 text-left hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent"
              >
                <span className="min-w-0 flex-1 truncate">{group.exerciseName}</span>
                <span className="shrink-0 text-logged">
                  {group.current.weight}
                  <span className="text-sm text-dim"> lbs</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="py-2">
        <button
          type="button"
          onClick={onAddPR}
          className="cursor-pointer text-dim hover:text-accent focus-visible:text-accent focus-visible:outline-none"
        >
          [ + add pr ]
        </button>
      </div>
    </div>
  );
}
