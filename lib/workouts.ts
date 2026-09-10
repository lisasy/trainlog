import { isMonthKeyInRange, MONTH_FULL_NAMES, parseDateKey, shiftDateKey, toDateKey } from "./dates";
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
  return setSplit(markCompleted(days, date), date, split);
}

/**
 * Gym-done, no split required. A day already marked is left as-is.
 */
export function markCompleted(days: TrainedDaysMap, date: DateKey): TrainedDaysMap {
  if (date in days) return days;
  return { ...days, [date]: { date } };
}

/**
 * Unmarks a day, dropping the whole entry — split and all.
 */
export function clearTrainedDay(days: TrainedDaysMap, date: DateKey): TrainedDaysMap {
  if (!(date in days)) return days;
  const next = { ...days };
  delete next[date];
  return next;
}

/** Sets or clears the split on a day that's already completed. */
export function setSplit(days: TrainedDaysMap, date: DateKey, split: string): TrainedDaysMap {
  const trimmed = split.trim();
  const existing = days[date];
  if (existing === undefined) return days;
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
 * Mean trained days per Sunday-start week, over the last `weeks` weeks
 * (including the in-progress one). Future days don't count.
 */
export function avgDaysPerWeek(
  days: TrainedDaysMap,
  today: DateKey,
  weeks = 4,
): number {
  if (today === "" || weeks <= 0) return 0;
  const windowStart = shiftDateKey(weekStartKey(today), -7 * (weeks - 1));
  let total = 0;
  for (const date of Object.keys(days)) {
    if (date > today || date < windowStart) continue;
    total += 1;
  }
  return Math.round((total / weeks) * 10) / 10;
}

/** Trained-day counts for each month of `year`. Future dates don't count. */
function trainedByMonthInYear(
  days: TrainedDaysMap,
  year: number,
  today: DateKey,
): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  if (today === "") return counts;
  const prefix = `${year}-`;
  for (const date of Object.keys(days)) {
    if (!date.startsWith(prefix) || date > today) continue;
    counts[Number(date.slice(5, 7)) - 1] += 1;
  }
  return counts;
}

/**
 * Months in `year` that have started (month ≤ today's month) and are
 * navigable. Jan/Feb 2026 render in year view but stay out of the average
 * because they're before `EARLIEST_MONTH_KEY`.
 */
function startedInRangeMonthCount(year: number, today: DateKey): number {
  if (today === "") return 0;
  const todayMonth = today.slice(0, 7);
  let count = 0;
  for (let month = 0; month < 12; month += 1) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    if (key > todayMonth || !isMonthKeyInRange(key, today)) continue;
    count += 1;
  }
  return count;
}

/**
 * Mean trained days per started, in-range month of `year`. Future days
 * don't count. One decimal.
 */
export function avgDaysInMonth(
  days: TrainedDaysMap,
  year: number,
  today: DateKey,
): number {
  const months = startedInRangeMonthCount(year, today);
  if (months === 0) return 0;
  const total = trainedByMonthInYear(days, year, today).reduce((sum, n) => sum + n, 0);
  return Math.round((total / months) * 10) / 10;
}

/**
 * Full month name with the most trained days in `year` (past/completed only).
 * Ties go to the latest month. None → null.
 */
export function mostActiveMonth(
  days: TrainedDaysMap,
  year: number,
  today: DateKey,
): string | null {
  const counts = trainedByMonthInYear(days, year, today);
  let best = -1;
  let bestCount = 0;
  for (let month = 0; month < 12; month += 1) {
    if (counts[month] >= bestCount && counts[month] > 0) {
      best = month;
      bestCount = counts[month];
    }
  }
  return best === -1 ? null : MONTH_FULL_NAMES[best];
}

/**
 * Trained days in `year` with date ≤ today — past/completed only, same
 * cutoff as streak.
 */
export function totalDaysShownUp(
  days: TrainedDaysMap,
  year: number,
  today: DateKey,
): number {
  return trainedByMonthInYear(days, year, today).reduce((sum, n) => sum + n, 0);
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

