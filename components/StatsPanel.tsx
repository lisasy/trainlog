"use client";

import { compactDateLabel } from "@/lib/dates";
import { groupByExercise } from "@/lib/prs";
import { FOCUS_RING, PRESSABLE } from "@/lib/styles";
import type { DateKey, PREntry, TrainedDaysMap } from "@/lib/types";
import { avgDaysInMonth, avgDaysPerWeek, mostActiveMonth, totalDaysShownUp } from "@/lib/workouts";

const STREAK_THRESHOLD = "3d/w";
const TILE_SURFACE = "rounded-2xl bg-fg/15 p-3";

function Tile({
  label,
  caption,
  value,
  unit,
  fill = false,
  valueSize = "lg",
  onClick,
}: {
  label: string;
  caption?: string;
  value: string | number;
  unit?: string;
  fill?: boolean;
  valueSize?: "lg" | "sm";
  onClick?: () => void;
}) {
  const body = (
    <>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm tracking-wide text-dim uppercase">{label}</span>
        {caption ? <span className="min-w-0 truncate text-sm text-dim">{caption}</span> : null}
      </div>
      <div className="mt-1 items-baseline">
        <span className={valueSize === "sm" ? "text-lg leading-snug text-accent" : "text-2xl text-accent"}>
          {value}
        </span>
        {unit ? <span className="ml-1 text-sm text-dim">{unit}</span> : null}
      </div>
    </>
  );

  const fillClass = fill ? "flex min-h-0 flex-col" : "";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={[
          "min-w-0 flex-1 text-left",
          TILE_SURFACE,
          fillClass,
          PRESSABLE,
          FOCUS_RING,
          "hover:bg-fg/25",
        ].join(" ")}
      >
        {body}
      </button>
    );
  }

  return <div className={`min-w-0 flex-1 ${TILE_SURFACE} ${fillClass}`}>{body}</div>;
}

export type StatTilesProps = {
  streakWeeks: number;
  prEntries: PREntry[];
  trainedDays: TrainedDaysMap;
  todayKey: DateKey;
  className?: string;
  /** Stretch tiles to fill leftover sheet height. */
  fill?: boolean;
  onOpenToday?: () => void;
  onOpenPRs?: () => void;
  variant?: "month" | "year";
  /** Displayed year — year-view tiles only. */
  yearFocus?: number;
};

/** Four stats. Month: today / streak / last PR / avg days per week. Year: year-scoped set. */
export function StatTiles({
  streakWeeks,
  prEntries,
  trainedDays,
  todayKey,
  className = "",
  fill = false,
  onOpenToday,
  onOpenPRs,
  variant = "month",
  yearFocus,
}: StatTilesProps) {
  const avgWeek = avgDaysPerWeek(trainedDays, todayKey);
  const topPR = groupByExercise(prEntries)[0];
  const trainedToday = trainedDays[todayKey];
  const year = yearFocus ?? (todayKey === "" ? 0 : Number(todayKey.slice(0, 4)));

  return (
    <div
      className={`grid min-h-0 grid-cols-2 gap-2 ${fill ? "flex-1" : ""} ${className}`}
    >
      {variant === "year" ? (
        <>
          <Tile
            label="avg days in month"
            value={avgDaysInMonth(trainedDays, year, todayKey).toFixed(1)}
            fill={fill}
          />
          <Tile
            label="most active month"
            value={mostActiveMonth(trainedDays, year, todayKey) ?? "—"}
            valueSize="sm"
            fill={fill}
          />
          <Tile
            label="total days shown up"
            value={totalDaysShownUp(trainedDays, year, todayKey)}
            fill={fill}
          />
          <Tile
            label="avg days per week"
            value={avgWeek.toFixed(1)}
            fill={fill}
          />
        </>
      ) : (
        <>
          <Tile
            label="today"
            caption={compactDateLabel(todayKey)}
            value={trainedToday ? (trainedToday.split ?? "completed") : "Not completed yet"}
            valueSize="sm"
            fill={fill}
            onClick={onOpenToday}
          />
          <Tile
            label="streak"
            caption={STREAK_THRESHOLD}
            value={streakWeeks}
            unit="weeks"
            fill={fill}
          />
          {topPR ? (
            <Tile
              label="last pr"
              caption={topPR.exerciseName}
              value={topPR.current.weight}
              unit="lbs"
              fill={fill}
              onClick={onOpenPRs}
            />
          ) : (
            <Tile label="last pr" value="—" fill={fill} onClick={onOpenPRs} />
          )}
          <Tile
            label="avg days per week"
            value={avgWeek.toFixed(1)}
            fill={fill}
          />
        </>
      )}
    </div>
  );
}
