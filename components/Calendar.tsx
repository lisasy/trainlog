"use client";

import { useEffect, useRef } from "react";

import {
  buildMonthGrid,
  isSameMonth,
  monthKey,
  monthLabel,
  parseDateKey,
  WEEKDAY_LABELS,
} from "@/lib/dates";
import type { DateKey, Split, TrainedDaysMap } from "@/lib/types";
import DayCell from "./DayCell";

export type CalendarProps = {
  /** The full navigable range, newest (current) month first. */
  months: Date[];
  /** The month the rest of the UI treats as current — header label, counts. */
  activeMonth: Date;
  todayKey: DateKey;
  trainedDays: TrainedDaysMap;
  /** Dates with at least one PR attached. */
  datesWithPRs: ReadonlySet<DateKey>;
  /** Which date's split picker is open, if any. */
  pickerDate: DateKey | null;
  /** Where the keyboard cursor sits. */
  cursorDate: DateKey | null;
  /**
   * The single source of truth for "which month is active" — called both when
   * scrolling brings a different month into view, and when a nav control
   * (prev/next/today, the sidebar, or the keyboard) asks to jump to one.
   */
  onActiveMonthChange: (month: Date) => void;
  onOpenPicker: (date: DateKey) => void;
  onClosePicker: () => void;
  onMarkDay: (date: DateKey, split: Split) => void;
  onClearDay: (date: DateKey) => void;
  onOpenDetail: (date: DateKey) => void;
};

type SharedGridProps = {
  todayKey: DateKey;
  trainedDays: TrainedDaysMap;
  datesWithPRs: ReadonlySet<DateKey>;
  pickerDate: DateKey | null;
  cursorDate: DateKey | null;
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

/*
 * Separators only — no frame around the grid. Each cell draws its own right
 * and bottom rule and the last column/row skip theirs, so the table is held
 * together by internal lines rather than boxed in.
 */
function WeekdayHeader() {
  return (
    <div className="grid grid-cols-7">
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
  );
}

/**
 * One month's worth of cells. Sized to its natural, compact height by
 * default (the mobile feed stacks several of these), but stretches to fill
 * its section at `lg` and up, where each month fills the whole calendar
 * area instead of several peeking at once.
 */
function MonthDayGrid({
  month,
  todayKey,
  trainedDays,
  datesWithPRs,
  pickerDate,
  cursorDate,
  onOpenPicker,
  onClosePicker,
  onMarkDay,
  onClearDay,
  onOpenDetail,
}: SharedGridProps & { month: Date }) {
  const days = buildMonthGrid(month).flat();
  const rowCount = days.length / 7;

  return (
    <div className="grid grid-cols-7 lg:flex-1 lg:auto-rows-fr">
      {days.map((dateKey, index) => {
        const column = index % 7;
        const row = Math.floor(index / 7);

        return (
          <DayCell
            key={dateKey}
            date={dateKey}
            dayNumber={String(parseDateKey(dateKey).getDate()).padStart(2, "0")}
            inMonth={isSameMonth(dateKey, month)}
            isToday={dateKey === todayKey}
            // YYYY-MM-DD sorts lexicographically, so a string compare is a
            // date compare.
            isFuture={dateKey > todayKey}
            isCursor={dateKey === cursorDate}
            trainedDay={trainedDays[dateKey]}
            hasPRs={datesWithPRs.has(dateKey)}
            isPickerOpen={pickerDate === dateKey}
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
  );
}

export default function Calendar({
  months,
  activeMonth,
  todayKey,
  trainedDays,
  datesWithPRs,
  pickerDate,
  cursorDate,
  onActiveMonthChange,
  onOpenPicker,
  onClosePicker,
  onMarkDay,
  onClearDay,
  onOpenDetail,
}: CalendarProps) {
  const activeKey = monthKey(activeMonth);
  // `months` is newest-first, so "previous" (older) is a higher index and
  // "next" (newer) is a lower one — there is no future month to move into.
  const activeIndex = months.findIndex((month) => monthKey(month) === activeKey);
  const canGoPrev = activeIndex !== -1 && activeIndex < months.length - 1;
  const canGoNext = activeIndex > 0;

  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef(new Map<string, HTMLDivElement>());
  const lastKnownKey = useRef(activeKey);
  const lastStepAt = useRef(0);
  /**
   * True while a programmatic scroll (nav button, keyboard, sidebar) is in
   * flight, so the scroll-spy observer below doesn't immediately report back
   * a mid-flight month and fight the very change that caused it to scroll.
   */
  const suppressObserver = useRef(false);
  const suppressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scrollToMonth(key: string) {
    const container = containerRef.current;
    const section = sectionRefs.current.get(key);
    if (container === null || section === undefined) return;
    suppressObserver.current = true;
    if (suppressTimeout.current !== null) clearTimeout(suppressTimeout.current);
    container.scrollTo({ top: section.offsetTop, behavior: "smooth" });
    // Smooth scrolling keeps firing intersection changes while it travels;
    // give it time to land before trusting the observer again.
    suppressTimeout.current = setTimeout(() => {
      suppressObserver.current = false;
    }, 500);
  }

  // Follow external requests to change the active month by scrolling to it —
  // the inverse of the scroll-spy effect below. Drives the "today" button,
  // the sidebar's month list, and the keyboard's month-boundary jumps.
  useEffect(() => {
    if (activeKey === lastKnownKey.current) return;
    lastKnownKey.current = activeKey;
    if (suppressObserver.current) return; // this change came from our own scroll
    scrollToMonth(activeKey);
  }, [activeKey]);

  // Scroll-spy: whichever month section sits nearest the top of the visible
  // area becomes the active one, the same way a real feed's header updates —
  // wheel, trackpad, and touch scrolling all land here without any handler
  // of their own, since this is just native scrolling.
  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (suppressObserver.current) return;
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const key = visible[0].target.getAttribute("data-month-key");
        if (key === null || key === lastKnownKey.current) return;
        const found = months.find((month) => monthKey(month) === key);
        if (found === undefined) return;
        lastKnownKey.current = key;
        onActiveMonthChange(found);
      },
      // Only the top band counts as "arrived" — a section merely peeking at
      // the bottom edge shouldn't steal the active state.
      { root: container, rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );

    for (const section of sectionRefs.current.values()) observer.observe(section);
    return () => observer.disconnect();
  }, [months, onActiveMonthChange]);

  /** Only used by the mobile prev/next/today buttons — scrolling itself is native. */
  function stepMonth(direction: 1 | -1) {
    if (direction === 1 ? !canGoNext : !canGoPrev) return;
    const now = Date.now();
    if (now - lastStepAt.current < 250) return;
    lastStepAt.current = now;
    const target = months[activeIndex - direction];
    if (target === undefined) return;
    onActiveMonthChange(target);
  }

  const gridProps: SharedGridProps = {
    todayKey,
    trainedDays,
    datesWithPRs,
    pickerDate,
    cursorDate,
    onOpenPicker,
    onClosePicker,
    onMarkDay,
    onClearDay,
    onOpenDetail,
  };

  return (
    <section aria-label="Training calendar" className="flex min-h-0 flex-1 flex-col">
      {/* Sequential nav for phones. On desktop the sidebar's month list does
          this job, so showing both would just be two ways to say the same. */}
      <div className="flex shrink-0 items-center justify-between lg:hidden">
        <div className="flex items-center">
          <BracketButton
            label="‹"
            onClick={() => stepMonth(-1)}
            ariaLabel="Previous month"
            disabled={!canGoPrev}
          />
          <span className="px-3 text-fg">{monthLabel(activeMonth)}</span>
          <BracketButton
            label="›"
            onClick={() => stepMonth(1)}
            ariaLabel="Next month"
            disabled={!canGoNext}
          />
        </div>
        <BracketButton
          label="today"
          onClick={() => months[0] !== undefined && onActiveMonthChange(months[0])}
          ariaLabel="Jump to current month"
        />
      </div>

      {/*
       * One continuous top-to-bottom feed, newest month first, at every
       * breakpoint — scrolling it is what moves between months, so the
       * motion on screen always matches the gesture. Scroll-snap settles it
       * on a whole month; nothing pops or swaps outright.
       *
       * On phones each month keeps its natural, compact height so the next
       * one peeks in below. At `lg` and up each month instead fills the
       * whole area (`lg:h-full` below, plus `lg:auto-rows-fr` on the grid),
       * so exactly one is ever on screen at rest.
       *
       * overflow-x-hidden is deliberate, not defensive filler: without it,
       * setting overflow-y to anything but visible makes the browser treat
       * overflow-x as auto too, and the opacity dimming below can still
       * round to a sub-pixel width difference — enough to spawn a real
       * horizontal scrollbar if this isn't pinned shut.
       */}
      <div
        ref={containerRef}
        className="min-h-0 flex-1 snap-y snap-mandatory overflow-x-hidden overflow-y-auto overscroll-contain"
      >
        {months.map((month) => {
          const key = monthKey(month);
          const isActive = key === activeKey;

          return (
            <div
              key={key}
              data-month-key={key}
              ref={(el) => {
                if (el) sectionRefs.current.set(key, el);
                else sectionRefs.current.delete(key);
              }}
              className={[
                "snap-start pt-3 transition-opacity duration-300 ease-out first:pt-0",
                "lg:flex lg:h-full lg:flex-col lg:pt-0",
                isActive ? "opacity-100" : "opacity-60",
              ].join(" ")}
            >
              <WeekdayHeader />
              <MonthDayGrid month={month} {...gridProps} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
