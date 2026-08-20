import { parseDateKey, shiftDateKey, toDateKey } from "./dates";
import { isSeedDate, seedTrainedDays } from "./seed";
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

/** The Sunday that starts the week containing `date`, matching the calendar. */
export function weekStartKey(date: DateKey): DateKey {
  const parsed = parseDateKey(date);
  parsed.setDate(parsed.getDate() - parsed.getDay());
  return toDateKey(parsed);
}

/**
 * Current streak: consecutive weeks with at least `threshold` trained days.
 *
 * Two deliberate rules:
 * - Scheduled days in the future never count. Only training that has actually
 *   happened can extend a streak.
 * - The in-progress week counts once it qualifies, but not qualifying *yet*
 *   doesn't break the streak — otherwise every streak would read zero until
 *   the third session of each week.
 */
export function currentStreakWeeks(
  days: TrainedDaysMap,
  today: DateKey,
  threshold = 3,
): number {
  if (today === "") return 0;

  const perWeek = new Map<DateKey, number>();
  for (const date of Object.keys(days)) {
    if (date > today) continue;
    const week = weekStartKey(date);
    perWeek.set(week, (perWeek.get(week) ?? 0) + 1);
  }

  const qualifies = (week: DateKey) => (perWeek.get(week) ?? 0) >= threshold;

  let streak = 0;
  let week = weekStartKey(today);
  if (qualifies(week)) streak += 1;

  week = shiftDateKey(week, -7);
  while (qualifies(week)) {
    streak += 1;
    week = shiftDateKey(week, -7);
  }
  return streak;
}

/**
 * Dates of seeded training days the user has cleared.
 *
 * Without these, clearing a seeded day would be undone on the next load.
 */
export function loadRemovedSeedDates(): string[] {
  const dates = read<string[]>("daySeedRemoved", []);
  return Array.isArray(dates) ? dates : [];
}

export function saveRemovedSeedDates(dates: string[]): void {
  write("daySeedRemoved", dates);
}

/**
 * Adds seeded days that aren't already present and haven't been cleared.
 * Idempotent, and never touches a day the user has already edited.
 */
export function applyTrainedSeed(
  days: TrainedDaysMap,
  removedDates: readonly string[],
): TrainedDaysMap {
  const removed = new Set(removedDates);
  let next: TrainedDaysMap | null = null;
  for (const [date, day] of Object.entries(seedTrainedDays())) {
    if (date in days || removed.has(date)) continue;
    if (next === null) next = { ...days };
    next[date] = day;
  }
  return next ?? days;
}

export { isSeedDate };
