"use client";

import type { DateKey, TrainedDay } from "@/lib/types";
import { FOCUS_RING, PRESSABLE } from "@/lib/styles";
import Tip from "./ui/Tip";

export type DayCellDensity = "month" | "year";

export type DayCellProps = {
  date: DateKey;
  dayNumber: string;
  inMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  isCursor: boolean;
  /** The day currently in CurrentCard. */
  isSelected: boolean;
  trainedDay?: TrainedDay;
  onTap: (date: DateKey) => void;
  /** Year density is paint-only heatmap cells. Same component, both layouts. */
  density?: DayCellDensity;
};

/**
 * The cell is two independent layers:
 *
 *   1. Identity — a status-driven fill + a marker dot. Always rendered; a
 *      completed past day, a scheduled future day, today, and an empty day
 *      each read differently without hovering.
 *   2. Selection — an inset ring laid *over* the identity, never replacing
 *      it. Selecting a completed day keeps its warm fill and dot and adds a
 *      ring.
 *
 * Year density collapses to a paint-only square: the same fill palette at a
 * fixed small size, no number, no button.
 */
export default function DayCell({
  date,
  dayNumber,
  inMonth,
  isToday,
  isFuture,
  isCursor,
  isSelected,
  trainedDay,
  onTap,
  density = "month",
}: DayCellProps) {
  const isTrained = trainedDay !== undefined;
  const split = trainedDay?.split;
  const isCompleted = isTrained && !isFuture;

  if (density === "year") {
    if (!inMonth) {
      return <div aria-hidden className="aspect-square w-full" />;
    }
    const tone = !isTrained
      ? "bg-fg/15"
      : isFuture
        ? "bg-scheduled"
        : "bg-logged";
    return (
      <span
        aria-hidden
        className={[
          "pointer-events-none block aspect-square w-full rounded-[2px]",
          tone,
          isToday ? "ring-1 ring-inset ring-accent" : "",
        ].join(" ")}
      />
    );
  }

  if (!inMonth) {
    return (
      <div aria-hidden className="h-[var(--day-cell-h)] w-full min-w-0" />
    );
  }

  // Layer 1 — identity fill + chrome, decided by the day's own status.
  const identityClass = isToday
    ? isTrained
      ? "border border-accent/70 bg-logged/12 hover:bg-logged/20"
      : "border border-accent/70 bg-surface/80 hover:bg-surface"
    : isTrained && isFuture
      ? "border border-dashed border-fg/25 hover:bg-surface/40"
      : isCompleted
        ? "bg-logged/12 hover:bg-logged/20"
        : isSelected
          ? "bg-fg/10 hover:bg-fg/15"
          : "hover:bg-surface/60";

  // Layer 2 — selection / cursor ring, orthogonal to the fill above.
  const ringClass = isSelected
    ? isToday
      ? "ring-1 ring-inset ring-accent"
      : "ring-1 ring-inset ring-fg/70"
    : isCursor && !isToday
      ? "ring-1 ring-inset ring-fg/60"
      : "";

  const numberClass =
    isToday || isSelected || isCompleted ? "font-bold text-fg" : "font-bold text-dim";

  return (
    <button
      type="button"
      onClick={() => onTap(date)}
      aria-pressed={isSelected}
      aria-label={`${date}${isToday ? " (today)" : ""}, ${
        isTrained ? `trained${split ? `, ${split}` : ""}` : "not trained"
      }`}
      className={[
        "group relative z-0 tap-target flex h-[var(--day-cell-h)] w-full min-w-0 flex-col items-center overflow-visible rounded-md p-1.5 text-center hover:z-10",
        PRESSABLE,
        FOCUS_RING,
        "sm:p-2",
        identityClass,
        ringClass,
      ].join(" ")}
    >
      {isToday ? (
        <svg
          aria-hidden
          className="today-stroke pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        >
          <rect
            x="1"
            y="1"
            rx="6"
            ry="6"
            pathLength={100}
            className="today-lightning"
          />
        </svg>
      ) : null}
      <span className={numberClass}>{dayNumber}</span>
      {split ? (
        <Tip className="bottom-2 left-1/2 hidden -translate-x-1/2 lg:block">{split}</Tip>
      ) : null}
      <span className="mt-1 flex h-2 items-center justify-center" aria-hidden>
        {isToday ? (
          isCompleted ? (
            <span className="h-1.5 w-1.5 rounded-full bg-logged" />
          ) : (
            <span className="today-dot inline-block h-2 w-2 rounded-full border border-accent" />
          )
        ) : isTrained && isFuture ? (
          <span className="h-1.5 w-1.5 rounded-full bg-dim" />
        ) : isCompleted ? (
          <span className="h-1.5 w-1.5 rounded-full bg-logged" />
        ) : null}
      </span>
    </button>
  );
}
