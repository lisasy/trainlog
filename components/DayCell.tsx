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
  density = "month",
}: DayCellProps) {
  const isTrained = trainedDay !== undefined;
  const split = trainedDay?.split;

  if (density === "year") {
    if (!inMonth) {
      return <div aria-hidden className="h-full min-h-0 w-full min-w-0" />;
    }
    const tone = !isTrained
      ? "bg-fg/10"
      : isFuture
        ? "bg-scheduled"
        : "bg-logged";
    return (
      <span
        aria-hidden
        className={[
          "pointer-events-none h-full min-h-0 w-full min-w-0 rounded-[2px]",
          tone,
          isToday ? "ring-1 ring-inset ring-accent" : "",
        ].join(" ")}
      />
    );
  }

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
        "group relative z-0 tap-target flex h-full min-h-0 w-full min-w-0 flex-col items-center overflow-visible rounded-md p-1.5 text-center hover:z-10",
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
      {split ? (
        <Tip className="bottom-2 left-1/2 hidden -translate-x-1/2 lg:block">{split}</Tip>
      ) : null}
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
