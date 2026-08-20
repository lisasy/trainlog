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
      className="tap-target flex h-11 items-center px-2 text-[13px] text-dim transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
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
  const weeks = buildMonthGrid(month);

  return (
    <section aria-label="Training calendar">
      <div className="flex items-center justify-between">
        <BracketButton label="‹" onClick={onPrevMonth} ariaLabel="Previous month" />
        <h2 className="text-[13px] tracking-[0.2em] text-fg">{monthLabel(month)}</h2>
        <BracketButton label="›" onClick={onNextMonth} ariaLabel="Next month" />
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS.map((day) => (
          <div key={day} className="pb-1 text-center text-[10px] tracking-[0.15em] text-dim">
            {day}
          </div>
        ))}

        {weeks.flat().map((key) => {
          const inMonth = isSameMonth(key, month);
          const trained = key in trainedDays;
          const isToday = key === todayKey;
          const dayNumber = parseDateKey(key).getDate();

          if (!inMonth) {
            // Adjacent-month padding: visible for orientation, not tappable —
            // so a mis-tap at the edge can't log a day you can't see.
            return (
              <div
                key={key}
                aria-hidden
                className="flex aspect-square min-h-11 min-w-0 flex-col items-center justify-center gap-1 border border-transparent text-[13px] text-dim/35"
              >
                <span>{String(dayNumber).padStart(2, "0")}</span>
                <span className="h-1.5 w-1.5" />
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
                // min-w-0 disables the grid item's automatic minimum size: without it,
                // min-h-11 transfers through aspect-square into a 44px min-width and
                // overflows the row on phones narrower than ~375px.
                "tap-target flex aspect-square min-h-11 min-w-0 flex-col items-center justify-center gap-1",
                "border text-[13px] leading-none transition-colors duration-100",
                "focus-visible:outline-none focus-visible:border-accent",
                isToday ? "border-dashed" : "",
                trained
                  ? "border-accent/70 text-accent glow-box"
                  : isToday
                    ? "border-accent/50 text-fg/80 hover:border-accent"
                    : "border-border text-fg/60 hover:border-dim",
              ].join(" ")}
            >
              <span className={trained ? "glow" : undefined}>
                {String(dayNumber).padStart(2, "0")}
              </span>
              {/* Marker slot is always present so numbers never shift on toggle. */}
              <span
                aria-hidden
                className={`h-1.5 w-1.5 ${trained ? "bg-accent glow-box" : "bg-transparent"}`}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex justify-center">
        <BracketButton label="TODAY" onClick={onJumpToToday} ariaLabel="Jump to current month" />
      </div>
    </section>
  );
}
