"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import {
  buildMonthGrid,
  isSameMonth,
  monthKey,
  parseDateKey,
  WEEKDAY_LABELS,
} from "@/lib/dates";
import { PRESSABLE } from "@/lib/styles";
import type { DateKey, TrainedDaysMap } from "@/lib/types";
import DayCell, { type DayCellProps } from "./DayCell";
import MonthDropdown from "./MonthDropdown";
import ThemeFaceButton from "./ThemeFaceButton";

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
  countsByMonth: Record<string, number>;
  currentMonthKey: string;
  onOpenTheme: () => void;
  /** Highlight the day whose editor is in CurrentCard. */
  sheetDate: DateKey | null;
};

type SharedGridProps = {
  todayKey: DateKey;
  trainedDays: TrainedDaysMap;
  cursorDate: DateKey | null;
  sheetDate: DateKey | null;
  onTap: DayCellProps["onTap"];
};

const HEADER_CHIP =
  "inline-flex h-8 items-center rounded-lg bg-surface px-2.5 text-dim";

export function WeekdayHeader() {
  return (
    <div className="grid grid-cols-7 gap-x-1 px-1.5 sm:px-2">
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
  sheetDate,
  onTap,
}: SharedGridProps & { month: Date }) {
  const weeks = buildMonthGrid(month);
  const weekRows = weeks.map(() => "minmax(0, 1fr)").join(" ");

  return (
    <div
      className="week-stack h-full min-h-0 flex-1 gap-y-1"
      style={
        {
          "--week-rows": weekRows,
          "--week-count": String(weeks.length),
        } as CSSProperties
      }
    >
      {weeks.map((week) => (
        <div
          key={week[0]}
          data-week-start={week[0]}
          className="min-h-0 overflow-hidden"
        >
          <div className="grid h-full min-h-0 grid-cols-7 grid-rows-1 gap-x-1 px-1.5 sm:px-2">
            {week.map((dateKey) => (
              <DayCell
                key={dateKey}
                date={dateKey}
                dayNumber={String(parseDateKey(dateKey).getDate()).padStart(2, "0")}
                inMonth={isSameMonth(dateKey, month)}
                isToday={dateKey === todayKey}
                isFuture={dateKey > todayKey}
                isCursor={dateKey === cursorDate}
                isSelected={dateKey === sheetDate}
                trainedDay={trainedDays[dateKey]}
                onTap={onTap}
              />
            ))}
          </div>
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
  countsByMonth,
  currentMonthKey,
  onOpenTheme,
  sheetDate,
}: CalendarProps) {
  const activeKey = monthKey(activeMonth);

  // Oldest on the left, current month on the right — paging back goes left.
  const feedMonths = useMemo(() => [...months].reverse(), [months]);

  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef(new Map<string, HTMLDivElement>());
  const lastKnownKey = useRef(activeKey);
  const suppressObserver = useRef(false);
  const suppressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didInitialScroll = useRef(false);

  function scrollToMonth(key: string, behavior: ScrollBehavior = "smooth") {
    const container = containerRef.current;
    const section = sectionRefs.current.get(key);
    if (container === null || section === undefined) return;
    suppressObserver.current = true;
    if (suppressTimeout.current !== null) clearTimeout(suppressTimeout.current);
    container.scrollTo({ left: section.offsetLeft, behavior });
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
        visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const key = visible[0].target.getAttribute("data-month-key");
        if (key === null || key === lastKnownKey.current) return;
        const found = months.find((month) => monthKey(month) === key);
        if (found === undefined) return;
        lastKnownKey.current = key;
        onActiveMonthChange(found);
      },
      { root: container, threshold: [0.55] },
    );

    for (const section of sectionRefs.current.values()) observer.observe(section);
    return () => observer.disconnect();
  }, [months, onActiveMonthChange]);

  const gridProps: SharedGridProps = {
    todayKey,
    trainedDays,
    cursorDate,
    sheetDate,
    onTap,
  };

  return (
    <section aria-label="Training calendar" className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 pb-3 lg:hidden">
        <div className="flex items-center justify-between">
          <span className={HEADER_CHIP}>{activeMonth.getFullYear()}</span>
          <ThemeFaceButton onOpenTheme={onOpenTheme} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <MonthDropdown
            variant="title"
            months={months}
            activeMonth={activeMonth}
            countsByMonth={countsByMonth}
            currentMonthKey={currentMonthKey}
            onSelectMonth={onActiveMonthChange}
          />
          <button
            type="button"
            onClick={() => months[0] !== undefined && onActiveMonthChange(months[0])}
            aria-label="Jump to current month"
            className={[
              HEADER_CHIP,
              PRESSABLE,
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
            ].join(" ")}
          >
            TODAY
          </button>
        </div>
      </div>

      <WeekdayHeader />

      <div className="relative min-h-[4rem] flex-1">
        <div
          ref={containerRef}
          className={[
            "absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          ].join(" ")}
        >
          {feedMonths.map((month) => {
            const key = monthKey(month);

            return (
              <div
                key={key}
                data-month-key={key}
                ref={(el) => {
                  if (el) sectionRefs.current.set(key, el);
                  else sectionRefs.current.delete(key);
                }}
                className="flex h-full w-full shrink-0 snap-start flex-col pt-2"
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
