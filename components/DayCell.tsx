"use client";

import type { DateKey, TrainedDay } from "@/lib/types";
import { PRESSABLE } from "@/lib/styles";
import { statusTextClass } from "./dayStatus";

export type DayCellProps = {
  date: DateKey;
  dayNumber: string;
  inMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  isCursor: boolean;
  trainedDay?: TrainedDay;
  onTap: (date: DateKey) => void;
};

export default function DayCell({
  date,
  dayNumber,
  inMonth,
  isToday,
  isFuture,
  isCursor,
  trainedDay,
  onTap,
}: DayCellProps) {
  const isTrained = trainedDay !== undefined;
  const split = trainedDay?.split;

  if (!inMonth) {
    return (
      <div
        aria-hidden
        className="flex h-full min-h-14 w-full min-w-0 flex-col items-center p-1.5 text-dim/30 sm:min-h-20 sm:p-2"
      >
        <span className="font-bold">{dayNumber}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onTap(date)}
      aria-haspopup="dialog"
      aria-label={`${date}${isToday ? " (today)" : ""}, ${
        isTrained ? `trained${split ? `, ${split}` : ""}` : "not trained"
      }`}
      className={[
        "tap-target relative flex h-full min-h-14 w-full min-w-0 flex-col items-center rounded-md p-1.5 text-center",
        PRESSABLE,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:min-h-20 sm:p-2",
        isCursor && !isToday ? "ring-1 ring-inset ring-fg/60" : "",
        isToday
          ? "glow-box border-2 border-accent/60 hover:bg-surface/60"
          : isTrained
            ? "bg-surface hover:bg-fg/5"
            : "hover:bg-surface/60",
      ].join(" ")}
    >
      <span
        className={`font-bold ${
          isToday ? "text-accent" : isTrained ? statusTextClass(isFuture) : "text-fg/90"
        }`}
      >
        {dayNumber}
      </span>
      {isTrained ? (
        <span
          className={`absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
            isFuture ? "bg-scheduled" : "bg-logged"
          }`}
          aria-hidden
        />
      ) : isToday ? (
        <span
          className="absolute top-1/2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent/70"
          aria-hidden
        />
      ) : null}
    </button>
  );
}
