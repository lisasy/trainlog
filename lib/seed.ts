import type { PREntry, TrainedDaysMap } from "./types";

/**
 * The PR history, transcribed from the source notes log.
 *
 * This file is the durable copy: it lives in the repo, so it repopulates on
 * any browser or device and survives clearing site data. Add new PRs here to
 * have them appear everywhere, or add them in the app for one device only.
 *
 * Weights are pounds throughout — the model stores a bare number.
 */

/**
 * Entries the source log records with no date.
 *
 * An empty string sorts before every real date, so these land at the bottom
 * of a newest-first list and are never treated as the current PR. It also
 * never equals a calendar day key, so they don't attach to any day.
 */
export const UNDATED = "";

export type SeedEntry = {
  exerciseName: string;
  weight: number;
  date: string;
  note?: string;
};

export const PR_SEED: SeedEntry[] = [
  { exerciseName: "deadlift", weight: 165, date: "2026-06-30" },
  { exerciseName: "deadlift", weight: 155, date: "2026-03-23" },
  { exerciseName: "deadlift", weight: 145, date: "2025-09-23" },

  { exerciseName: "lat pull", weight: 100, date: "2026-06-14" },
  { exerciseName: "lat pull", weight: 75, date: UNDATED },

  { exerciseName: "leg press", weight: 275, date: "2026-08-18" },
  { exerciseName: "leg press", weight: 250, date: "2026-07-27" },
  { exerciseName: "leg press", weight: 230, date: "2026-07-09" },
  { exerciseName: "leg press", weight: 204, date: "2025-09-21" },

  { exerciseName: "single leg press", weight: 70, date: "2026-06-06" },

  { exerciseName: "rdl", weight: 105, date: "2025-08-01" },
  { exerciseName: "rdl", weight: 95, date: UNDATED },

  { exerciseName: "hip thrust", weight: 135, date: "2026-08-18" },
  { exerciseName: "hip thrust", weight: 105, date: "2026-08-01" },

  { exerciseName: "dumbbell alternating lunges", weight: 20, date: UNDATED, note: "each" },

  { exerciseName: "dumbbell row", weight: 20, date: UNDATED },
  { exerciseName: "dumbbell bicep curl", weight: 20, date: UNDATED },

  { exerciseName: "farmers carry", weight: 62, date: "2026-07-09", note: "each" },
  {
    exerciseName: "farmers carry",
    weight: 44,
    date: UNDATED,
    note: "each, 3 sets, 1:45, 1:15, 55s",
  },

  { exerciseName: "cable row", weight: 85, date: "2026-07-01" },

  { exerciseName: "barbell squat", weight: 75, date: "2026-08-01" },
  { exerciseName: "barbell squat", weight: 65, date: "2026-06-30" },

  { exerciseName: "rear delt machine", weight: 60, date: UNDATED },

  { exerciseName: "shoulder press", weight: 25, date: "2026-06-27" },

  // Appended: inserting earlier in this list would shift seed ids and
  // duplicate rows already stored in the browser.
  { exerciseName: "deadlift", weight: 175, date: "2026-09-04" },
  { exerciseName: "hip thrust", weight: 145, date: "2026-09-03" },
  { exerciseName: "barbell squat", weight: 85, date: "2026-09-01" },
];

/**
 * Stable id for a seed entry.
 *
 * Derived from its contents rather than random, so re-running the seed
 * recognizes entries it already added instead of duplicating them. The index
 * suffix keeps ids unique if two rows ever share exercise, weight and date.
 */
function seedId(entry: SeedEntry, index: number): string {
  const slug = entry.exerciseName.toLowerCase().replace(/\s+/g, "-");
  return `seed:${slug}:${entry.weight}:${entry.date || "undated"}:${index}`;
}

export function seedEntries(): PREntry[] {
  return PR_SEED.map((entry, index) => ({ id: seedId(entry, index), ...entry }));
}

export function isSeedId(id: string): boolean {
  return id.startsWith("seed:");
}

/**
 * Training days, transcribed from the "Gym" checkbox in the source task app.
 *
 * The value is the split, or "" where the source only recorded that training
 * happened. Seeded additively like the PRs: a day already in storage keeps
 * whatever split it has, so editing one in the app is never overwritten.
 */
export const TRAINED_SEED: Record<string, string> = {
  // March is only partly visible in the source (it appears as trailing days
  // of the April view), so these two are all that's known for that month.
  "2026-03-29": "",
  "2026-03-31": "",

  "2026-04-01": "",
  "2026-04-04": "",
  "2026-04-05": "",
  "2026-04-07": "",
  "2026-04-08": "",
  "2026-04-09": "",
  "2026-04-12": "",
  "2026-04-14": "",
  "2026-04-15": "",
  "2026-04-16": "",
  "2026-04-17": "",
  "2026-04-18": "",
  "2026-04-22": "",
  "2026-04-23": "",
  "2026-04-25": "",
  "2026-04-27": "",
  "2026-04-29": "",

  "2026-05-01": "",
  "2026-05-03": "",
  "2026-05-05": "",
  "2026-05-06": "",
  "2026-05-08": "",
  "2026-05-10": "",
  "2026-05-11": "",
  "2026-05-12": "",
  "2026-05-14": "",
  "2026-05-16": "",
  "2026-05-18": "",
  "2026-05-21": "",
  "2026-05-22": "",
  "2026-05-23": "",
  "2026-05-25": "",
  "2026-05-29": "",
  "2026-05-30": "",

  "2026-06-01": "",
  "2026-06-02": "",
  "2026-06-03": "",
  "2026-06-05": "",
  "2026-06-07": "",
  "2026-06-08": "",
  "2026-06-10": "",
  "2026-06-12": "",
  "2026-06-13": "",
  "2026-06-14": "",
  "2026-06-16": "",
  "2026-06-18": "",
  "2026-06-23": "",
  "2026-06-24": "",
  "2026-06-27": "",
  "2026-06-30": "",

  "2026-07-01": "",
  "2026-07-03": "",
  "2026-07-04": "",
  "2026-07-06": "",
  "2026-07-07": "",
  "2026-07-09": "",
  "2026-07-11": "",
  "2026-07-13": "",
  "2026-07-14": "",
  "2026-07-16": "",
  "2026-07-17": "",
  "2026-07-20": "",
  "2026-07-22": "",
  "2026-07-24": "",
  "2026-07-27": "",
  "2026-07-28": "",
  "2026-07-30": "",

  "2026-08-01": "",
  "2026-08-03": "",
  "2026-08-05": "",
  "2026-08-06": "",
  "2026-08-09": "pull",
  "2026-08-10": "lower",
  // The task app marks the 12th, not the 11th; the "push" split was entered
  // against the 11th in trainlog. Treated as the same session, moved here.
  "2026-08-12": "push",
  "2026-08-17": "pull",
  "2026-08-18": "lower",

  // Scheduled ahead at the time of transcription. These become ordinary past
  // days once their date passes, and will count toward streaks then.
  "2026-08-21": "push",
  "2026-08-22": "lower",
  "2026-08-24": "pull",
  "2026-08-25": "lower",

  // Past the original transcription cutoff so the current month isn't blank.
  "2026-09-01": "pull",
  "2026-09-03": "lower",
  "2026-09-04": "push",
  "2026-09-06": "lower",
  "2026-09-08": "pull",
};

export function seedTrainedDays(): TrainedDaysMap {
  const days: TrainedDaysMap = {};
  for (const [date, split] of Object.entries(TRAINED_SEED)) {
    // The source only records that training happened on most of these days.
    days[date] = split === "" ? { date } : { date, split };
  }
  return days;
}

export function isSeedDate(date: string): boolean {
  return date in TRAINED_SEED;
}
