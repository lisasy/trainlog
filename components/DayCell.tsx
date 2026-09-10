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
 * Month cells match the Figma rest calendar: a number, an optional status
 * fill/dot, and an inset ring for selection. Identity and selection stay
 * independent so a completed day keeps its fill when selected.
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
  const completed = isTrained && !isFuture;
  const scheduled = isTrained && isFuture;

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

  const fillClass = completed ? "bg-surface hover:bg-border" : "hover:bg-surface/80";
  const dashClass = scheduled ? "border border-dashed border-fg/40" : "";
  const ringClass =
    isSelected || isToday
      ? "ring-1 ring-inset ring-logged"
      : isCursor
        ? "ring-1 ring-inset ring-fg/60"
        : "";
  const numberClass = !inMonth
    ? "text-dim/30"
    : completed
      ? "text-logged"
      : "text-fg/90";

  return (
    <button
      type="button"
      onClick={() => onTap(date)}
      aria-pressed={isSelected}
      aria-label={`${date}${isToday ? " (today)" : ""}, ${
        isTrained ? `trained${split ? `, ${split}` : ""}` : "not trained"
      }`}
      className={[
        "group relative z-0 tap-target flex h-[var(--day-cell-h)] w-full min-w-0 flex-col items-center rounded-md p-1.5 text-center hover:z-10 lg:h-full lg:min-h-0 lg:justify-center",
        PRESSABLE,
        FOCUS_RING,
        fillClass,
        dashClass,
        ringClass,
      ].join(" ")}
    >
      <span className={`font-bold ${numberClass}`}>{dayNumber}</span>
      {split ? (
        <Tip className="bottom-2 left-1/2 hidden -translate-x-1/2 lg:block">{split}</Tip>
      ) : null}
      <span className="mt-0.5 flex h-1.5 items-center justify-center" aria-hidden>
        {completed ? (
          <span className="size-1.5 rounded-full bg-logged" />
        ) : scheduled ? (
          <span className="size-1.5 rounded-full border border-fg/50" />
        ) : null}
      </span>
    </button>
  );
}
