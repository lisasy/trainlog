"use client";

import { useMemo, useRef, type CSSProperties } from "react";
import {
  buildMonthGrid,
  isMonthInRange,
  isSameMonth,
  MONTH_LABELS,
  monthKey,
  monthsInYear,
  parseDateKey,
  WEEKDAY_LABELS,
} from "@/lib/dates";
import { FOCUS_RING, PRESSABLE } from "@/lib/styles";
import type { DateKey, TrainedDaysMap } from "@/lib/types";
import DayCell, { type DayCellDensity, type DayCellProps } from "./DayCell";

const SWIPE_PX = 64;

export type CalendarProps = {
  activeMonth: Date;
  todayKey: DateKey;
  trainedDays: TrainedDaysMap;
  cursorDate: DateKey | null;
  onTap: DayCellProps["onTap"];
  sheetDate: DateKey | null;
  yearView: boolean;
  yearFocus: number;
  onPickMonth: (month: Date) => void;
  onStepYear: (direction: 1 | -1) => void;
  canGoPrevYear: boolean;
  canGoNextYear: boolean;
};

type SharedGridProps = {
  todayKey: DateKey;
  trainedDays: TrainedDaysMap;
  cursorDate: DateKey | null;
  sheetDate: DateKey | null;
  onTap: DayCellProps["onTap"];
};

export function WeekdayHeader() {
  return (
    <div className="grid w-full grid-cols-7 gap-x-1 px-1.5 sm:px-2">
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
  density,
  todayKey,
  trainedDays,
  cursorDate,
  sheetDate,
  onTap,
}: SharedGridProps & { month: Date; density: DayCellDensity }) {
  const weeks = buildMonthGrid(month);
  const isYear = density === "year";

  // 0-based row of the open day sheet within this month. Drives the
  // translateY that brings the focused week under the header when the board
  // collapses. Falls back to the first row when the sheet day isn't here.
  const focusWeek =
    sheetDate === null
      ? 0
      : Math.max(
          0,
          weeks.findIndex((week) => week.includes(sheetDate)),
        );

  return (
    <div
      className={["week-stack", isYear ? "" : "mt-1.5 gap-y-1"].join(" ")}
      data-density={density}
      style={
        {
          "--week-count": String(weeks.length),
          "--focus-week": String(focusWeek),
        } as CSSProperties
      }
    >
      {weeks.map((week) => (
        <div
          key={week[0]}
          data-week-start={week[0]}
          className="relative z-0 min-h-0 overflow-visible"
        >
          <div
            className={
              isYear
                ? "grid grid-cols-7 gap-[2px]"
                : "grid grid-cols-7 gap-x-1 px-1.5 sm:px-2"
            }
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
                isSelected={dateKey === sheetDate}
                trainedDay={trainedDays[dateKey]}
                onTap={onTap}
                density={density}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MonthView({
  month,
  focus,
  ...gridProps
}: SharedGridProps & { month: Date; focus: boolean }) {
  // Same var on the viewport so its rest height (= weekCount × stride) is
  // exact per month, not padded to a fixed 6.
  const weekCount = buildMonthGrid(month).length;
  return (
    <div
      className={[
        "flex min-h-0 flex-1 flex-col",
        focus ? "justify-end" : "",
      ].join(" ")}
    >
      <WeekdayHeader />
      <div
        className="week-viewport mt-1.5 min-h-0"
        data-focus={focus ? "true" : "false"}
        style={{ "--week-count": String(weekCount) } as CSSProperties}
      >
        <MonthDayGrid month={month} density="month" {...gridProps} />
      </div>
    </div>
  );
}

function YearGrid({
  yearMonths,
  yearFocus,
  onPickMonth,
  onStepYear,
  canGoPrevYear,
  canGoNextYear,
  ...gridProps
}: SharedGridProps & {
  yearMonths: Date[];
  yearFocus: number;
  onPickMonth: (month: Date) => void;
  onStepYear: (direction: 1 | -1) => void;
  canGoPrevYear: boolean;
  canGoNextYear: boolean;
}) {
  const swipeStartX = useRef(0);
  const swiping = useRef(false);

  return (
    <div
      className="grid min-h-0 flex-1 grid-cols-4 grid-rows-3 gap-x-2 gap-y-5 px-1 pt-2 pb-3 sm:gap-x-3 sm:gap-y-6 sm:px-2"
      aria-label={`${yearFocus} months`}
      onPointerDown={(event) => {
        swipeStartX.current = event.clientX;
        swiping.current = false;
      }}
      onPointerMove={(event) => {
        if (Math.abs(event.clientX - swipeStartX.current) > 12) swiping.current = true;
      }}
      onPointerUp={(event) => {
        const dx = event.clientX - swipeStartX.current;
        if (Math.abs(dx) < SWIPE_PX) return;
        if (dx > 0 && canGoPrevYear) onStepYear(-1);
        else if (dx < 0 && canGoNextYear) onStepYear(1);
      }}
      onClickCapture={(event) => {
        if (!swiping.current) return;
        event.preventDefault();
        event.stopPropagation();
        swiping.current = false;
      }}
    >
      {yearMonths.map((month) => {
        const key = monthKey(month);
        const enabled = isMonthInRange(month, gridProps.todayKey);

        return (
          <div
            key={key}
            data-month-slot={key}
            className={[
              "min-h-0 rounded-lg px-0.5 py-1.5",
              enabled
                ? `${PRESSABLE} ${FOCUS_RING} hover:bg-surface`
                : "pointer-events-none opacity-35",
            ].join(" ")}
            onClick={enabled ? () => onPickMonth(month) : undefined}
            role={enabled ? "button" : undefined}
            tabIndex={enabled ? 0 : undefined}
            onKeyDown={
              enabled
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onPickMonth(month);
                    }
                  }
                : undefined
            }
            aria-label={month.toLocaleString("en-US", { month: "long", year: "numeric" })}
          >
            <div className="flex h-7 w-full shrink-0 items-center">
              <div className="text-sm tracking-wide text-dim uppercase">
                {MONTH_LABELS[month.getMonth()]}
              </div>
            </div>
            <MonthDayGrid month={month} density="year" {...gridProps} />
          </div>
        );
      })}
    </div>
  );
}

export default function Calendar({
  activeMonth,
  todayKey,
  trainedDays,
  cursorDate,
  onTap,
  sheetDate,
  yearView,
  yearFocus,
  onPickMonth,
  onStepYear,
  canGoPrevYear,
  canGoNextYear,
}: CalendarProps) {
  const activeKey = monthKey(activeMonth);
  const yearMonths = useMemo(() => monthsInYear(yearFocus), [yearFocus]);

  const gridProps: SharedGridProps = {
    todayKey,
    trainedDays,
    cursorDate,
    sheetDate,
    onTap,
  };

  return (
    <section
      aria-label={yearView ? `${yearFocus} year` : "Training calendar"}
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div
        key={yearView ? "year" : activeKey}
        className="cal-fade flex min-h-0 flex-1 flex-col"
      >
        {yearView ? (
          <YearGrid
            yearMonths={yearMonths}
            yearFocus={yearFocus}
            onPickMonth={onPickMonth}
            onStepYear={onStepYear}
            canGoPrevYear={canGoPrevYear}
            canGoNextYear={canGoNextYear}
            {...gridProps}
          />
        ) : (
          <MonthView month={activeMonth} focus={sheetDate !== null} {...gridProps} />
        )}
      </div>
    </section>
  );
}
