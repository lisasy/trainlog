"use client";

import { useRef } from "react";

import {
  addMonths,
  buildMonthGrid,
  isMonthInRange,
  isSameMonth,
  monthLabel,
  parseDateKey,
  WEEKDAY_LABELS,
} from "@/lib/dates";
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
  /** Where the keyboard cursor sits. */
  cursorDate: DateKey | null;
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
  disabled,
}: {
  label: string;
  onClick: () => void;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className="tap-target inline-flex h-11 cursor-pointer items-center text-dim transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:text-dim/30 disabled:hover:text-dim/30"
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
  cursorDate,
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

  /**
   * Wheel and swipe both step months, but they arrive very differently.
   *
   * A trackpad flick fires a burst of small wheel events, so deltas are
   * accumulated against a threshold and the burst is reset once it goes quiet;
   * without that, one flick would skip half a year. A cooldown keeps a long
   * continuous scroll from running away too.
   */
  // March 2026 is the start of the history; the current month is the end.
  // There is nothing to show outside that, so both ends are hard stops.
  const canGoPrev = isMonthInRange(addMonths(month, -1), todayKey);
  const canGoNext = isMonthInRange(addMonths(month, 1), todayKey);

  const wheelDelta = useRef(0);
  const wheelResetAt = useRef(0);
  const lastStepAt = useRef(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function stepMonth(direction: 1 | -1) {
    if (direction === 1 ? !canGoNext : !canGoPrev) return;
    const now = Date.now();
    if (now - lastStepAt.current < 250) return;
    lastStepAt.current = now;
    if (direction === 1) onNextMonth();
    else onPrevMonth();
  }

  function handleWheel(event: React.WheelEvent) {
    const now = Date.now();
    // A gap between events means a new gesture, not a continuation.
    if (now > wheelResetAt.current) wheelDelta.current = 0;
    wheelResetAt.current = now + 220;

    wheelDelta.current += event.deltaY;
    if (Math.abs(wheelDelta.current) < 40) return;
    stepMonth(wheelDelta.current > 0 ? 1 : -1);
    wheelDelta.current = 0;
  }

  function handleTouchStart(event: React.TouchEvent) {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (start === null) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    // Horizontal only, and clearly horizontal — a vertical swipe belongs to
    // the page, and stealing it would break scrolling on small screens.
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    stepMonth(dx < 0 ? 1 : -1);
  }

  return (
    <section
      aria-label="Training calendar"
      className="flex min-h-0 flex-1 flex-col"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sequential nav for phones. On desktop the sidebar's month list does
          this job, so showing both would just be two ways to say the same. */}
      <div className="flex items-center justify-between lg:hidden">
        <div className="flex items-center">
          <BracketButton
            label="‹"
            onClick={onPrevMonth}
            ariaLabel="Previous month"
            disabled={!canGoPrev}
          />
          <span className="px-3 text-fg">{monthLabel(month)}</span>
          <BracketButton
            label="›"
            onClick={onNextMonth}
            ariaLabel="Next month"
            disabled={!canGoNext}
          />
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
              isCursor={key === cursorDate}
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
