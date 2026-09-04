"use client";

import { useEffect, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  buildMonthGrid,
  isSameMonth,
  monthKey,
  monthLabel,
  parseDateKey,
  WEEKDAY_LABELS,
} from "@/lib/dates";
import type { DateKey, TrainedDaysMap } from "@/lib/types";
import NavButton from "./NavButton";
import DayCell, { type DayCellProps } from "./DayCell";

/** Height of the sticky weekday header, kept in sync with `scroll-pt-7`. */
const HEADER_OFFSET = 28;

export type CalendarProps = {
  /** The full navigable range, newest (current) month first. */
  months: Date[];
  /** The month the rest of the UI treats as current — header label, counts. */
  activeMonth: Date;
  todayKey: DateKey;
  trainedDays: TrainedDaysMap;
  /** Where the keyboard cursor sits. */
  cursorDate: DateKey | null;
  onActiveMonthChange: (month: Date) => void;
  onTap: DayCellProps["onTap"];
};

type SharedGridProps = {
  todayKey: DateKey;
  trainedDays: TrainedDaysMap;
  cursorDate: DateKey | null;
  onTap: DayCellProps["onTap"];
};

export function WeekdayHeader() {
  return (
    <div className="sticky top-0 z-10 grid grid-cols-7 gap-x-1 bg-bg px-1.5 sm:px-2">
      {WEEKDAY_LABELS.map((day) => (
        <div key={day} className="min-w-0 truncate py-1 text-sm text-dim">
          {day}
        </div>
      ))}
    </div>
  );
}

function MonthDayGrid({
  month,
  todayKey,
  trainedDays,
  cursorDate,
  onTap,
}: SharedGridProps & { month: Date }) {
  const weeks = buildMonthGrid(month);

  return (
    <div className="flex flex-col gap-y-1 lg:flex-1">
      {weeks.map((week) => (
        <div
          key={week[0]}
          data-week-start={week[0]}
          className="grid grid-cols-7 gap-x-1 px-1.5 sm:px-2 lg:flex-1"
        >
          {week.map((dateKey) => (
            <DayCell
              key={dateKey}
              date={dateKey}
              dayNumber={String(parseDateKey(dateKey).getDate()).padStart(2, "0")}
              inMonth={isSameMonth(dateKey, month)}
              isToday={dateKey === todayKey}
              isFuture={dateKey > todayKey}
              isCursor={dateKey === cursorDate}
              trainedDay={trainedDays[dateKey]}
              onTap={onTap}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Calendar({
  months,
  activeMonth,
  todayKey,
  trainedDays,
  cursorDate,
  onActiveMonthChange,
  onTap,
}: CalendarProps) {
  const activeKey = monthKey(activeMonth);
  const activeIndex = months.findIndex((month) => monthKey(month) === activeKey);
  const canGoPrev = activeIndex !== -1 && activeIndex < months.length - 1;
  const canGoNext = activeIndex > 0;

  // The feed runs oldest → newest, so the earliest month sits at the top and
  // the current month at the bottom, the way a timeline reads.
  const feedMonths = useMemo(() => [...months].reverse(), [months]);

  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef(new Map<string, HTMLDivElement>());
  const lastKnownKey = useRef(activeKey);
  const lastStepAt = useRef(0);
  const suppressObserver = useRef(false);
  const suppressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didInitialScroll = useRef(false);

  function scrollToMonth(key: string, behavior: ScrollBehavior = "smooth") {
    const container = containerRef.current;
    const section = sectionRefs.current.get(key);
    if (container === null || section === undefined) return;
    suppressObserver.current = true;
    if (suppressTimeout.current !== null) clearTimeout(suppressTimeout.current);
    // The container is the offset parent (position: relative), so offsetTop is
    // the section's position within the scroll content; back off the sticky
    // header so the month lands just below it rather than under it.
    container.scrollTo({ top: Math.max(0, section.offsetTop - HEADER_OFFSET), behavior });
    suppressTimeout.current = setTimeout(
      () => {
        suppressObserver.current = false;
      },
      behavior === "smooth" ? 500 : 50,
    );
  }

  useEffect(() => {
    if (activeKey === lastKnownKey.current) return;
    lastKnownKey.current = activeKey;
    if (suppressObserver.current) return;
    scrollToMonth(activeKey);
  }, [activeKey]);

  // The current month lives at the bottom of the feed now, so jump there once
  // the sections exist rather than opening on the earliest month.
  useEffect(() => {
    if (didInitialScroll.current) return;
    if (sectionRefs.current.get(activeKey) === undefined) return;
    didInitialScroll.current = true;
    scrollToMonth(activeKey, "auto");
  }, [feedMonths, activeKey]);

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
      { root: container, rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );

    for (const section of sectionRefs.current.values()) observer.observe(section);
    return () => observer.disconnect();
  }, [months, onActiveMonthChange]);

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
    cursorDate,
    onTap,
  };

  return (
    <section aria-label="Training calendar" className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 pb-2 lg:hidden">
        <div className="flex items-center gap-2">
          <NavButton
            label={<ChevronLeft size={16} />}
            onClick={() => stepMonth(-1)}
            ariaLabel="Previous month"
            disabled={!canGoPrev}
          />
          <span className="px-1 text-fg">{monthLabel(activeMonth)}</span>
          <NavButton
            label={<ChevronRight size={16} />}
            onClick={() => stepMonth(1)}
            ariaLabel="Next month"
            disabled={!canGoNext}
          />
        </div>
        <NavButton
          label="today"
          onClick={() => months[0] !== undefined && onActiveMonthChange(months[0])}
          ariaLabel="Jump to current month"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className="relative h-full snap-y snap-proximity overflow-x-hidden overflow-y-auto overscroll-contain scroll-pt-7 pb-[38dvh] lg:snap-mandatory lg:pb-0"
        >
          {/* One header for the whole feed — it stays put while the months
              scroll under it, instead of repeating on every month. */}
          <WeekdayHeader />
          {feedMonths.map((month) => {
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
                  "snap-start pt-3 transition-opacity duration-300 ease-out",
                  "lg:flex lg:h-full lg:flex-col lg:pt-2",
                  isActive ? "opacity-100" : "opacity-60",
                ].join(" ")}
              >
                <MonthDayGrid month={month} {...gridProps} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
