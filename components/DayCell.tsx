"use client";

import type { DateKey, TrainedDay } from "@/lib/types";
import { FOCUS_RING, PRESSABLE } from "@/lib/styles";

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
};

/**
 * Day numbers stay muted. Status lives in the chrome + the dot under the
 * number: filled logged for days already trained, dashed + dim for scheduled
 * ahead, a hollow accent ring for today.
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
}: DayCellProps) {
  const isTrained = trainedDay !== undefined;
  const split = trainedDay?.split;

  if (!inMonth) {
    return (
      <div
        aria-hidden
        className="h-full min-h-0 w-full min-w-0"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => onTap(date)}
      aria-pressed={isSelected}
      aria-label={`${date}${isToday ? " (today)" : ""}, ${
        isTrained ? `trained${split ? `, ${split}` : ""}` : "not trained"
      }`}
      className={[
        "tap-target flex h-full min-h-0 w-full min-w-0 flex-col items-center rounded-md p-1.5 text-center",
        PRESSABLE,
        FOCUS_RING,
        "sm:p-2",
        isCursor && !isToday && !isSelected ? "ring-1 ring-inset ring-fg/60" : "",
        isToday
          ? "relative overflow-visible border border-accent/70 bg-surface/80"
          : isSelected
            ? "bg-fg/10 hover:bg-fg/15"
            : isTrained && isFuture
              ? "border border-dashed border-fg/25 hover:bg-surface/40"
              : isTrained
                ? "bg-surface hover:bg-fg/5"
                : "hover:bg-surface/60",
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
      <span className={isSelected || isToday ? "font-bold text-fg" : "font-bold text-dim"}>{dayNumber}</span>
      <span className="mt-1 flex h-2 items-center justify-center" aria-hidden>
        {isToday ? (
          <span className="today-dot inline-block h-2 w-2 rounded-full border border-accent" />
        ) : isTrained && isFuture ? (
          <span className="h-1.5 w-1.5 rounded-full bg-dim" />
        ) : isTrained ? (
          <span className="h-1.5 w-1.5 rounded-full bg-logged" />
        ) : null}
      </span>
    </button>
  );
}
