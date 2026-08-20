/**
 * Shared data model for trainlog.
 *
 * Mirrors the user's actual workflow: a daily "gym: done" checkbox plus a
 * running per-exercise weight+date PR log. Deliberately NOT a set-by-set
 * workout logger — see the spec's data model notes.
 */

/** A date in local-time `YYYY-MM-DD` form. Never an ISO timestamp. */
export type DateKey = string;

/**
 * The split options offered when marking a day.
 *
 * `TrainedDay.split` stays a plain string so anything already in storage
 * still loads, but the UI only ever writes one of these.
 */
export const SPLITS = ["pull", "push", "core", "lower"] as const;

export type Split = (typeof SPLITS)[number];

export function isSplit(value: string | undefined): value is Split {
  return value !== undefined && (SPLITS as readonly string[]).includes(value);
}

export type TrainedDay = {
  date: DateKey;
  /** One of SPLITS when set through the UI; freeform for anything older. */
  split?: string;
  notes?: string;
};

export type PREntry = {
  id: string;
  /** Freeform, autocompleted from prior entries. */
  exerciseName: string;
  weight: number;
  date: DateKey;
  /** Optional freeform, e.g. "3 sets, 1:45/1:15/55s". */
  note?: string;
};

/** One entry per date the user marked as trained. Drives calendar + streaks. */
export type TrainedDaysMap = Record<DateKey, TrainedDay>;
