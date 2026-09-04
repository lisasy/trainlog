"use client";

import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";

import { buildYearGrid, dayLabel } from "@/lib/dates";
import type { DateKey, TrainedDaysMap } from "@/lib/types";

export type YearHeatmapProps = {
  year: number;
  trainedDays: TrainedDaysMap;
  todayKey: DateKey;
  /** Stretch the grid to fill its container instead of sizing by width. */
  fill?: boolean;
};

type Ripple = { id: number; week: number; day: number };

const SHIMMER_MS = 550;
const STEP_MS = 22;

export default function YearHeatmap({ year, trainedDays, todayKey, fill = false }: YearHeatmapProps) {
  const weeks = buildYearGrid(year);
  const yearPrefix = `${year}-`;
  const trainedCount = Object.keys(trainedDays).filter((date) => date.startsWith(yearPrefix)).length;

  const [ripple, setRipple] = useState<Ripple | null>(null);

  useEffect(() => {
    if (ripple === null) return;
    // Longest possible stagger (opposite corner) plus one animation.
    const timeout = window.setTimeout(
      () => setRipple(null),
      (weeks.length + 7) * STEP_MS + SHIMMER_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [ripple, weeks.length]);

  function onGridClick(event: MouseEvent<HTMLDivElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cell = (event.target as HTMLElement).closest<HTMLElement>("[data-week]");
    setRipple({
      id: Date.now(),
      week: cell ? Number(cell.dataset.week) : 0,
      day: cell ? Number(cell.dataset.day) : 0,
    });
  }

  // Padding days from the adjacent year (so every week has 7 cells) render
  // the same as an untrained day rather than a hole — the grid should read
  // as one solid rectangle, not a jagged edge on the first and last weeks.
  function cellTone(date: DateKey): string {
    const trained = date.startsWith(yearPrefix) && date in trainedDays;
    if (!trained) return "bg-fg/10";
    return date > todayKey ? "bg-scheduled" : "bg-logged";
  }

  const gap = fill ? "gap-[3px]" : "gap-[2px]";
  // When filling a tall column, wrap the year into stacked bands so the cells
  // are big enough to read instead of a single hairline strip.
  const bandCount = fill ? 3 : 1;
  const perBand = Math.ceil(weeks.length / bandCount);
  const bands = Array.from({ length: bandCount }, (_, i) =>
    weeks.slice(i * perBand, (i + 1) * perBand),
  );

  function Cell({
    date,
    weekIndex,
    dayIndex,
  }: {
    date: DateKey;
    weekIndex: number;
    dayIndex: number;
  }) {
    const trained = date.startsWith(yearPrefix) && date in trainedDays;
    const shimmering = ripple !== null && trained;
    const delay = ripple
      ? (Math.abs(weekIndex - ripple.week) + Math.abs(dayIndex - ripple.day)) * STEP_MS
      : 0;
    return (
      <span
        data-week={weekIndex}
        data-day={dayIndex}
        aria-hidden
        title={date.startsWith(yearPrefix) ? dayLabel(date) : undefined}
        className={`aspect-square w-full rounded-[3px] ${cellTone(date)}${
          shimmering ? " heatmap-shimmer" : ""
        }`}
        style={shimmering ? ({ "--shimmer-delay": `${delay}ms` } as CSSProperties) : undefined}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm tracking-wide text-dim uppercase">{year}</span>
        <span className="text-sm text-dim">{trainedCount} days</span>
      </div>
      <div
        className={`flex flex-col ${fill ? "gap-1" : "gap-2"}`}
        role="img"
        aria-label={`${trainedCount} days trained in ${year}`}
        onClick={onGridClick}
      >
        {bands.map((band, bandIndex) => (
          <div key={band[0]?.[0] ?? bandIndex} className={`flex ${gap}`}>
            {band.map((week, localWeekIndex) => {
              const weekIndex = bandIndex * perBand + localWeekIndex;
              return (
                <div key={week[0]} className={`flex flex-1 flex-col ${gap}`}>
                  {week.map((date, dayIndex) => (
                    <Cell
                      key={ripple ? `${date}-${ripple.id}` : date}
                      date={date}
                      weekIndex={weekIndex}
                      dayIndex={dayIndex}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
