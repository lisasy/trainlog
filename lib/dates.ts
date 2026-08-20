import type { DateKey } from "./types";

/**
 * Local-time date helpers.
 *
 * Everything here works in the browser's local timezone on purpose. `new
 * Date("2026-08-19")` parses as UTC midnight, which lands on the *previous*
 * day for anyone west of Greenwich — so we never hand a date string to the
 * Date constructor. Parse explicitly, format explicitly.
 */

/** Monday-first, matching the ISO weeks the streak calc will use later. */
export const WEEKDAY_LABELS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const MONTH_LABELS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
] as const;

export function toDateKey(date: Date): DateKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: DateKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): DateKey {
  return toDateKey(new Date());
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

/** e.g. "2026 / aug" — bracketed by the caller for the terminal look. */
export function monthLabel(date: Date): string {
  return `${date.getFullYear()} / ${MONTH_LABELS[date.getMonth()]}`;
}

/** e.g. "aug 2026" — reads better in a narrow sidebar list. */
export function monthNameYear(date: Date): string {
  return `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}

/** e.g. "2026/aug" — for the shell-style path in the header. */
export function monthPath(date: Date): string {
  return `${date.getFullYear()}/${MONTH_LABELS[date.getMonth()]}`;
}

/** e.g. "2026-08" — the key `countTrainedByMonth` groups on. */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Months since year 0 — lets us step and compare months as plain integers. */
function monthIndex(date: Date): number {
  return date.getFullYear() * 12 + date.getMonth();
}

/**
 * The sidebar's month list, newest first.
 *
 * Anchored on the current month rather than the displayed one, so the list
 * doesn't shift under you as you page around. `mustInclude` widens the range
 * when you've navigated outside it, guaranteeing the active month is present.
 */
export function monthListDescending(
  anchor: Date,
  back: number,
  forward: number,
  mustInclude: Date,
): Date[] {
  const anchorIndex = monthIndex(anchor);
  const includeIndex = monthIndex(mustInclude);
  const high = Math.max(anchorIndex + forward, includeIndex);
  const low = Math.min(anchorIndex - back, includeIndex);

  const months: Date[] = [];
  for (let i = high; i >= low; i -= 1) {
    months.push(new Date(Math.floor(i / 12), i % 12, 1));
  }
  return months;
}

/** Long-form label for the day sheet header, e.g. "WED 2026-08-19". */
export function dayLabel(key: DateKey): string {
  const date = parseDateKey(key);
  // getDay() is Sunday-first; shift to our Monday-first labels.
  const weekday = WEEKDAY_LABELS[(date.getDay() + 6) % 7];
  return `${weekday} ${key}`;
}

export function isSameMonth(key: DateKey, month: Date): boolean {
  const date = parseDateKey(key);
  return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
}

/**
 * Build the calendar grid for `month` as whole Monday-start weeks, padded with
 * the adjacent months' days so every row has 7 cells.
 */
export function buildMonthGrid(month: Date): DateKey[][] {
  const first = startOfMonth(month);
  // How many leading days from the previous month this month's 1st needs.
  const leading = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const weekCount = Math.ceil((leading + daysInMonth) / 7);

  const weeks: DateKey[][] = [];
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1 - leading);

  for (let w = 0; w < weekCount; w += 1) {
    const week: DateKey[] = [];
    for (let d = 0; d < 7; d += 1) {
      week.push(toDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}
