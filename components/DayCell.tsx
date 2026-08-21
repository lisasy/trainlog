"use client";

import type { DateKey, Split, TrainedDay } from "@/lib/types";
import SplitPicker from "./SplitPicker";
import { statusTextClass, statusTintClass } from "./dayStatus";
import { useLongPress } from "./useLongPress";

export type DayCellProps = {
  date: DateKey;
  dayNumber: string;
  inMonth: boolean;
  isToday: boolean;
  /** Later than today — marking it is planning ahead, not logging. */
  isFuture: boolean;
  /** The keyboard cursor is on this day. */
  isCursor: boolean;
  trainedDay?: TrainedDay;
  hasPRs: boolean;
  isPickerOpen: boolean;
  isLastColumn: boolean;
  isLastRow: boolean;
  flipUp: boolean;
  alignRight: boolean;
  onOpenPicker: (date: DateKey) => void;
  onClosePicker: () => void;
  onMarkDay: (date: DateKey, split: Split) => void;
  onClearDay: (date: DateKey) => void;
  onOpenDetail: (date: DateKey) => void;
};

export default function DayCell({
  date,
  dayNumber,
  inMonth,
  isToday,
  isFuture,
  isCursor,
  trainedDay,
  hasPRs,
  isPickerOpen,
  isLastColumn,
  isLastRow,
  flipUp,
  alignRight,
  onOpenPicker,
  onClosePicker,
  onMarkDay,
  onClearDay,
  onOpenDetail,
}: DayCellProps) {
  const longPress = useLongPress({
    onLongPress: () => onOpenDetail(date),
    onClick: () => onOpenPicker(date),
  });

  const isTrained = trainedDay !== undefined;
  const split = trainedDay?.split;
  const heading = isTrained ? "edit workout" : isFuture ? "schedule workout" : "[+] add workout";

  const frame = [
    "relative flex min-h-14 min-w-0 flex-col sm:min-h-20",
    isLastColumn ? "" : "border-r border-dotted border-border",
    isLastRow ? "" : "border-b border-dotted border-border",
  ].join(" ");

  if (!inMonth) {
    // Adjacent-month padding: keeps the table rectangular, but isn't tappable,
    // so an edge mis-tap can't log a day you can't see.
    return (
      <div aria-hidden className={`${frame} p-1.5 text-dim/30 sm:p-2`}>
        <span>{dayNumber}</span>
      </div>
    );
  }

  return (
    <div className={frame}>
      <button
        type="button"
        {...longPress}
        aria-haspopup="dialog"
        aria-expanded={isPickerOpen}
        aria-label={`${date}${isToday ? " (today)" : ""}, ${
          isTrained ? `trained${split ? `, ${split}` : ""}` : "not trained"
        }`}
        className={[
          "tap-target group flex h-full w-full cursor-pointer flex-col justify-between p-1.5 text-left",
          "transition-colors duration-100 focus-visible:bg-fg/10 focus-visible:outline-none sm:p-2",
          // outline rather than border: no layout shift as the cursor moves.
          isCursor ? "outline outline-1 -outline-offset-1 outline-fg/60" : "",
          isTrained ? statusTintClass(isFuture) : "hover:bg-fg/5",
        ].join(" ")}
      >
        <span className="flex w-full items-start justify-between gap-1">
          {/*
           * Today is drawn as an inverted block — a terminal marks its cursor
           * position by reversing the cell, not by outlining it.
           */}
          <span
            className={
              isToday
                ? "bg-accent px-1 text-bg"
                : isTrained
                  ? statusTextClass(isFuture)
                  : "text-fg/55"
            }
          >
            {dayNumber}
          </span>
          {isTrained ? (
            // Done gets a check; something still ahead only gets a marker,
            // since nothing has been completed yet.
            <span className={statusTextClass(isFuture)} aria-hidden>
              {isFuture ? "▪" : "✓"}
            </span>
          ) : null}
        </span>

        <span className="flex w-full min-w-0 flex-col">
          {isTrained && isFuture ? (
            <span className="hidden truncate text-sm text-scheduled/75 sm:block">scheduled</span>
          ) : null}
          <span className="flex w-full items-baseline justify-between gap-1">
            {split ? (
              <span className={`hidden truncate text-sm sm:block ${statusTextClass(isFuture)}`}>
                {split}
              </span>
            ) : (
              <span />
            )}
            {hasPRs ? (
              <span className="text-sm text-dim" aria-label="has prs">
                pr
              </span>
            ) : null}
          </span>
        </span>

        {/* Centered in the cell, square by design, hidden while this cell's
            picker is open. */}
        {isPickerOpen ? null : (
          <span
            role="tooltip"
            className="tip pointer-events-none absolute top-1/2 left-1/2 z-30 -translate-x-1/2 -translate-y-1/2 rounded-none border border-border bg-bg px-2 py-0.5 text-sm whitespace-nowrap text-fg"
          >
            {heading}
          </span>
        )}
      </button>

      {isPickerOpen ? (
        <SplitPicker
          heading={heading}
          isTrained={isTrained}
          currentSplit={split}
          flipUp={flipUp}
          alignRight={alignRight}
          onSelect={(nextSplit) => onMarkDay(date, nextSplit)}
          onClear={() => onClearDay(date)}
          onOpenDetail={() => onOpenDetail(date)}
          onClose={onClosePicker}
        />
      ) : null}
    </div>
  );
}
