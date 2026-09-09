"use client";

import { groupByExercise } from "@/lib/prs";
import type { PREntry } from "@/lib/types";

const STREAK_THRESHOLD = "3d/w";

function Tile({
  label,
  caption,
  value,
  unit,
}: {
  label: string;
  caption: string;
  value: string | number;
  unit: string;
}) {
  return (
    <div className="min-w-0 flex-1 rounded-2xl bg-bg/60 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm tracking-wide text-dim uppercase">{label}</span>
        <span className="min-w-0 truncate text-sm text-dim">{caption}</span>
      </div>
      <div className="mt-1 items-baseline">
        <span className="text-2xl text-accent">{value}</span>
        <span className="ml-1 text-sm text-dim">{unit}</span>
      </div>
    </div>
  );
}

export type StatTilesProps = {
  streakWeeks: number;
  prEntries: PREntry[];
  /** "row" (side by side) or "col" (stacked). */
  direction?: "row" | "col";
  className?: string;
};

/** The streak + top-PR pair. */
export function StatTiles({ streakWeeks, prEntries, direction = "row", className = "" }: StatTilesProps) {
  const topPR = groupByExercise(prEntries)[0];
  return (
    <div className={`flex gap-2 ${direction === "col" ? "flex-col" : ""} ${className}`}>
      <Tile label="streak" caption={STREAK_THRESHOLD} value={streakWeeks} unit="weeks" />
      {topPR ? (
        <Tile label="pr" caption={topPR.exerciseName} value={topPR.current.weight} unit="lbs" />
      ) : null}
    </div>
  );
}
