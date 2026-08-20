"use client";

import { buildMonthGrid, isSameMonth, monthLabel, parseDateKey, WEEKDAY_LABELS } from "@/lib/dates";
import type { DateKey, TrainedDaysMap } from "@/lib/types";

export type CalendarProps = {
  /** Any date inside the month being displayed. */
  month: Date;
  todayKey: DateKey;
  trainedDays: TrainedDaysMap;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onJumpToToday: () => void;
  /** One tap = trained/not-trained. Kept deliberately cheap. */
  onToggleDay: (date: DateKey) => void;
};

function BracketButton({
  label,
  onClick,
  ariaLabel,
}: {
  label: string;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="tap-target inline-flex h-11 items-center text-dim transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
    >
      <span aria-hidden>[</span>
      <span className="px-1.5">{label}</span>
      <span aria-hidden>]</span>
    </button>
  );
}

export default function Calendar({
  month,
  todayKey,
  trainedDays,
  onPrevMonth,
  onNextMonth,
  onJumpToToday,
  onToggleDay,
}: CalendarProps) {
  const days = buildMonthGrid(month).flat();

  return (
    <section aria-label="Training calendar" className="flex min-h-0 flex-1 flex-col">
      {/* Sequential nav for phones. On desktop the sidebar's month list does
          this job, so showing both would just be two ways to say the same. */}
      <div className="flex items-center justify-between lg:hidden">
        <div className="flex items-center">
          <BracketButton label="‹" onClick={onPrevMonth} ariaLabel="Previous month" />
          <span className="px-3 text-fg">{monthLabel(month)}</span>
          <BracketButton label="›" onClick={onNextMonth} ariaLabel="Next month" />
        </div>
        <BracketButton label="today" onClick={onJumpToToday} ariaLabel="Jump to current month" />
      </div>

      {/*
       * One contiguous table: the container draws the top and left rules, each
       * cell draws its own right and bottom. No gaps — adjacent cells share a
       * single hairline, the way a box-drawn terminal table does.
       *
       * The header is its own grid so the day grid can use auto-rows-fr and
       * stretch to fill the viewport without the header row stretching too.
       * Both are grid-cols-7 at the same width, so the columns stay aligned.
       */}
      <div className="mt-2 grid grid-cols-7 border-t border-l border-border lg:mt-0">
        {WEEKDAY_LABELS.map((day) => (
          <div key={day} className="min-w-0 truncate border-r border-b border-border px-2 py-1 text-dim">
            {day}
          </div>
        ))}
      </div>

      <div className="grid flex-1 auto-rows-fr grid-cols-7 border-l border-border">
        {days.map((key) => {
          const inMonth = isSameMonth(key, month);
          const trained = key in trainedDays;
          const isToday = key === todayKey;
          const split = trainedDays[key]?.split;
          const dayNumber = String(parseDateKey(key).getDate()).padStart(2, "0");

          // min-h keeps rows touch-sized on phones; auto-rows-fr on the grid
          // lets them grow past it to fill a desktop viewport.
          const cellShape =
            "flex min-h-14 min-w-0 flex-col justify-between border-r border-b border-border p-1.5 text-left sm:min-h-20 sm:p-2";

          if (!inMonth) {
            // Adjacent-month padding: keeps the table rectangular, but isn't
            // tappable, so an edge mis-tap can't log a day you can't see.
            return (
              <div key={key} aria-hidden className={`${cellShape} text-dim/30`}>
                <span>{dayNumber}</span>
              </div>
            );
          }

          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggleDay(key)}
              aria-pressed={trained}
              aria-label={`${key}${isToday ? " (today)" : ""}, ${trained ? "trained" : "not trained"}`}
              className={[
                "tap-target transition-colors duration-100",
                cellShape,
                "focus-visible:outline-none focus-visible:bg-fg/10",
                trained ? "bg-accent/10 hover:bg-accent/15" : "hover:bg-fg/5",
              ].join(" ")}
            >
              <span className="flex w-full items-start justify-between gap-1">
                {/*
                 * Today is drawn as an inverted block — a terminal marks its
                 * cursor position by reversing the cell, not by outlining it.
                 */}
                <span
                  className={
                    isToday
                      ? "bg-accent px-1 text-bg"
                      : trained
                        ? "text-accent glow"
                        : "text-fg/55"
                  }
                >
                  {dayNumber}
                </span>
                {trained ? (
                  <span className="text-accent glow" aria-hidden>
                    ▪
                  </span>
                ) : null}
              </span>

              {split ? (
                <span className="hidden w-full truncate text-dim sm:block">{split}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
