import { read, write } from "./storage";
import type { DateKey, TrainedDay, TrainedDaysMap } from "./types";

/**
 * trainedDays CRUD.
 *
 * The mutators are pure: they take the current map and return a new one, so
 * callers stay in control of when state and storage are updated. Persistence
 * is the explicit `saveTrainedDays` call.
 */

export function loadTrainedDays(): TrainedDaysMap {
  return read<TrainedDaysMap>("trainedDays", {});
}

export function saveTrainedDays(days: TrainedDaysMap): void {
  write("trainedDays", days);
}

/** Trained-day totals keyed by "YYYY-MM", for the sidebar's month list. */
export function countTrainedByMonth(days: TrainedDaysMap): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const date of Object.keys(days)) {
    const month = date.slice(0, 7);
    counts[month] = (counts[month] ?? 0) + 1;
  }
  return counts;
}

export function isTrained(days: TrainedDaysMap, date: DateKey): boolean {
  return date in days;
}

export function getTrainedDay(days: TrainedDaysMap, date: DateKey): TrainedDay | undefined {
  return days[date];
}

/**
 * Marks a day trained with a split, or changes the split of a day that's
 * already marked. Any notes already on the day survive.
 */
export function markTrained(days: TrainedDaysMap, date: DateKey, split: string): TrainedDaysMap {
  const existing = days[date] ?? { date };
  return { ...days, [date]: { ...existing, date, split } };
}

/**
 * Unmarks a day, dropping the whole entry — split and all. The checkbox habit
 * this mirrors has no "trained but blank" state.
 */
export function clearTrainedDay(days: TrainedDaysMap, date: DateKey): TrainedDaysMap {
  if (!(date in days)) return days;
  const next = { ...days };
  delete next[date];
  return next;
}

/** Marks the day trained if it wasn't already — split implies a session. */
export function setSplit(days: TrainedDaysMap, date: DateKey, split: string): TrainedDaysMap {
  const trimmed = split.trim();
  const existing = days[date] ?? { date };
  const next: TrainedDay = { ...existing, split: trimmed === "" ? undefined : trimmed };
  if (next.split === undefined) delete next.split;
  return { ...days, [date]: next };
}

export function setNotes(days: TrainedDaysMap, date: DateKey, notes: string): TrainedDaysMap {
  const trimmed = notes.trim();
  const existing = days[date] ?? { date };
  const next: TrainedDay = { ...existing, notes: trimmed === "" ? undefined : trimmed };
  if (next.notes === undefined) delete next.notes;
  return { ...days, [date]: next };
}
