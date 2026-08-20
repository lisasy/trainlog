"use client";

import { buildMonthGrid, isSameMonth, monthLabel, parseDateKey, WEEKDAY_LABELS } from "@/lib/dates";
import type { DateKey, Split, TrainedDaysMap } from "@/lib/types";
import DayCell from "./DayCell";

export type CalendarProps = {
  /** Any date inside the month being displayed. */
  month: Date;
  todayKey: DateKey;
  trainedDays: TrainedDaysMap;
  /** Dates with at least one PR attached. */
  datesWithPRs: ReadonlySet<DateKey>;
  /** Which date's split picker is open, if any. */
  pickerDate: DateKey | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onJumpToToday: () => void;
  onOpenPicker: (date: DateKey) => void;
  onClosePicker: () => void;
  onMarkDay: (date: DateKey, split: Split) => void;
  onClearDay: (date: DateKey) => void;
  onOpenDetail: (date: DateKey) => void;
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
      className="tap-target inline-flex h-11 cursor-pointer items-center text-dim transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
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
  datesWithPRs,
  pickerDate,
  onPrevMonth,
  onNextMonth,
  onJumpToToday,
  onOpenPicker,
  onClosePicker,
  onMarkDay,
  onClearDay,
  onOpenDetail,
}: CalendarProps) {
  const days = buildMonthGrid(month).flat();
  const rowCount = days.length / 7;

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
       * Separators only — no frame around the grid. Each cell draws its own
       * right and bottom rule and the last column/row skip theirs, so the
       * table is held together by internal lines rather than boxed in.
       *
       * The header is its own grid so the day grid can use auto-rows-fr and
       * stretch to fill the viewport without the header row stretching too.
       * Both are grid-cols-7 at the same width, so the columns stay aligned.
       */}
      <div className="mt-2 grid grid-cols-7 lg:mt-0">
        {WEEKDAY_LABELS.map((day, index) => (
          <div
            key={day}
            className={[
              "min-w-0 truncate border-b border-dotted border-border px-1.5 py-1 text-sm text-dim sm:px-2",
              index === 6 ? "" : "border-r border-dotted border-border",
            ].join(" ")}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid flex-1 auto-rows-fr grid-cols-7">
        {days.map((key, index) => {
          const column = index % 7;
          const row = Math.floor(index / 7);

          return (
            <DayCell
              key={key}
              date={key}
              dayNumber={String(parseDateKey(key).getDate()).padStart(2, "0")}
              inMonth={isSameMonth(key, month)}
              isToday={key === todayKey}
              // YYYY-MM-DD sorts lexicographically, so a string compare is a
              // date compare.
              isFuture={key > todayKey}
              trainedDay={trainedDays[key]}
              hasPRs={datesWithPRs.has(key)}
              isPickerOpen={pickerDate === key}
              isLastColumn={column === 6}
              isLastRow={row === rowCount - 1}
              // Popovers near the bottom or right edge open the other way.
              flipUp={row >= rowCount - 2}
              alignRight={column >= 5}
              onOpenPicker={onOpenPicker}
              onClosePicker={onClosePicker}
              onMarkDay={onMarkDay}
              onClearDay={onClearDay}
              onOpenDetail={onOpenDetail}
            />
          );
        })}
      </div>
    </section>
  );
}
