"use client";

import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  invertCss,
  invertSelf,
  prefersReducedMotion,
  YEAR_ZOOM_MS,
  zoomTransition,
} from "@/lib/cameraZoom";
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
import { FOCUS_RING } from "@/lib/styles";
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
  density: DayCellDensity;
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
  todayKey,
  trainedDays,
  cursorDate,
  sheetDate,
  onTap,
  density,
}: SharedGridProps & { month: Date }) {
  const weeks = buildMonthGrid(month);
  const weekRows = weeks.map(() => "minmax(0, 1fr)").join(" ");

  return (
    <div
      className="week-stack mt-1.5 h-full min-h-0 flex-1 gap-y-1"
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
          className="relative z-0 min-h-0 overflow-visible"
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
                density={density}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MonthModule({
  month,
  lifted,
  density,
  layerRef,
  todayKey,
  trainedDays,
  cursorDate,
  sheetDate,
  onTap,
}: SharedGridProps & {
  month: Date;
  lifted: boolean;
  layerRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={layerRef}
      className={
        lifted
          ? "absolute inset-0 z-10 flex flex-col bg-bg will-change-transform"
          : "flex h-full min-h-0 flex-col will-change-transform"
      }
      style={{ transformOrigin: "0 0" }}
    >
      <div className="flex h-7 w-full shrink-0 items-center">
        {density === "month" ? (
          <WeekdayHeader />
        ) : (
          <div className="text-sm tracking-wide text-dim uppercase">
            {MONTH_LABELS[month.getMonth()]}
          </div>
        )}
      </div>
      <MonthDayGrid
        month={month}
        todayKey={todayKey}
        trainedDays={trainedDays}
        cursorDate={cursorDate}
        sheetDate={sheetDate}
        onTap={onTap}
        density={density}
      />
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

  const boardRef = useRef<HTMLDivElement>(null);
  const layerEls = useRef(new Map<string, HTMLDivElement>());
  const slotEls = useRef(new Map<string, HTMLDivElement>());
  const firstRect = useRef<DOMRect | null>(null);
  const flipRaf = useRef(0);
  const swipeStartX = useRef(0);
  const swiping = useRef(false);
  const anim = useRef<"idle" | "expand" | "expand-play" | "collapse-chrome" | "collapse-flip">(
    "idle",
  );

  const [lifted, setLifted] = useState(!yearView);
  const [surface, setSurface] = useState<"year" | "month">(yearView ? "year" : "month");

  const gridProps = {
    todayKey,
    trainedDays,
    cursorDate,
    sheetDate,
    onTap,
  };

  function playFlip(el: HTMLElement, first: DOMRect, last: DOMRect, onDone?: () => void) {
    const snap = () => {
      el.style.transition = "none";
      el.style.transform = "none";
      onDone?.();
    };
    if (prefersReducedMotion()) {
      snap();
      return;
    }
    const invert = invertSelf(first, last);
    if (invert === null) {
      snap();
      return;
    }
    el.style.transition = "none";
    el.style.transform = invertCss(invert);
    void el.getBoundingClientRect();
    cancelAnimationFrame(flipRaf.current);
    let settled = false;
    let timeout = 0;
    function finish() {
      if (settled) return;
      settled = true;
      el.removeEventListener("transitionend", onEnd);
      window.clearTimeout(timeout);
      el.style.transition = "none";
      el.style.transform = "none";
      onDone?.();
    }
    function onEnd(event: TransitionEvent) {
      if (event.target !== el || event.propertyName !== "transform") return;
      finish();
    }
    el.addEventListener("transitionend", onEnd);
    flipRaf.current = requestAnimationFrame(() => {
      el.style.transition = zoomTransition(true);
      el.style.transform = "none";
    });
    timeout = window.setTimeout(finish, YEAR_ZOOM_MS + 80);
  }

  function pickMonth(month: Date) {
    const el = layerEls.current.get(monthKey(month));
    if (el) firstRect.current = el.getBoundingClientRect();
    onPickMonth(month);
  }

  useLayoutEffect(() => {
    const el = layerEls.current.get(activeKey);

    if (!yearView) {
      if (anim.current === "expand-play") return;
      if (!lifted) {
        if (el !== undefined && firstRect.current === null) {
          firstRect.current = el.getBoundingClientRect();
        }
        anim.current = "expand";
        setLifted(true);
        setSurface("year");
        return;
      }
      if (anim.current === "expand" && el !== undefined) {
        const first = firstRect.current;
        firstRect.current = null;
        anim.current = "expand-play";
        if (first !== null) {
          playFlip(el, first, el.getBoundingClientRect(), () => {
            anim.current = "idle";
            setSurface("month");
          });
        } else {
          anim.current = "idle";
          setSurface("month");
        }
      }
      return;
    }

    if (!lifted && anim.current === "collapse-flip" && el !== undefined && firstRect.current !== null) {
      const first = firstRect.current;
      firstRect.current = null;
      playFlip(el, first, el.getBoundingClientRect(), () => {
        anim.current = "idle";
      });
      return;
    }

    if (anim.current === "collapse-flip") return;

    if (lifted && surface === "month") {
      anim.current = "collapse-chrome";
      setSurface("year");
      return;
    }

    if (lifted && surface === "year" && el !== undefined) {
      firstRect.current = el.getBoundingClientRect();
      anim.current = "collapse-flip";
      setLifted(false);
    }
  }, [yearView, lifted, surface, activeKey]);

  return (
    <section
      aria-label={yearView ? `${yearFocus} year` : "Training calendar"}
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div ref={boardRef} className="relative min-h-0 flex-1">
        <div
          className="grid h-full min-h-0 grid-cols-4 grid-rows-3 gap-x-4 gap-y-5 px-2 pt-2 pb-3 sm:gap-x-5 sm:gap-y-6 sm:px-3"
          aria-label={yearView ? `${yearFocus} months` : undefined}
          onPointerDown={
            yearView
              ? (event) => {
                  swipeStartX.current = event.clientX;
                  swiping.current = false;
                }
              : undefined
          }
          onPointerMove={
            yearView
              ? (event) => {
                  if (Math.abs(event.clientX - swipeStartX.current) > 12) swiping.current = true;
                }
              : undefined
          }
          onPointerUp={
            yearView
              ? (event) => {
                  const dx = event.clientX - swipeStartX.current;
                  if (Math.abs(dx) < SWIPE_PX) return;
                  if (dx > 0 && canGoPrevYear) onStepYear(-1);
                  else if (dx < 0 && canGoNextYear) onStepYear(1);
                }
              : undefined
          }
          onClickCapture={
            yearView
              ? (event) => {
                  if (!swiping.current) return;
                  event.preventDefault();
                  event.stopPropagation();
                  swiping.current = false;
                }
              : undefined
          }
        >
          {yearMonths.map((month) => {
            const key = monthKey(month);
            const isLifted = lifted && key === activeKey;
            const enabled = isMonthInRange(month, todayKey);
            const density: DayCellDensity =
              isLifted && surface === "month" ? "month" : "year";

            return (
              <div
                key={key}
                data-month-slot={key}
                ref={(node) => {
                  if (node) slotEls.current.set(key, node);
                  else slotEls.current.delete(key);
                }}
                className={[
                  "min-h-0 rounded-lg px-1.5 py-1.5",
                  !enabled ? "pointer-events-none opacity-35" : "",
                  yearView && enabled
                    ? `cursor-pointer ${FOCUS_RING} hover:bg-surface active:brightness-90`
                    : "",
                  lifted && key !== activeKey ? "pointer-events-none" : "",
                ].join(" ")}
                onClick={
                  yearView && enabled
                    ? () => pickMonth(month)
                    : undefined
                }
                role={yearView && enabled ? "button" : undefined}
                tabIndex={yearView && enabled ? 0 : undefined}
                onKeyDown={
                  yearView && enabled
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          pickMonth(month);
                        }
                      }
                    : undefined
                }
                aria-label={
                  yearView
                    ? month.toLocaleString("en-US", { month: "long", year: "numeric" })
                    : undefined
                }
              >
                <MonthModule
                  month={month}
                  lifted={isLifted}
                  density={density}
                  layerRef={(node) => {
                    if (node) layerEls.current.set(key, node);
                    else layerEls.current.delete(key);
                  }}
                  {...gridProps}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
