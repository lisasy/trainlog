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
 * Training days from the source log, keyed by date.
 *
 * Seeded the same way the PRs are: additive only. A day already in storage
 * keeps whatever split it has, so changing one in the app is never overwritten.
 */
export const TRAINED_SEED: Record<string, string> = {
  "2026-08-09": "pull",
  "2026-08-10": "lower",
  "2026-08-11": "push",
  "2026-08-17": "pull",
  "2026-08-18": "lower",

  // Scheduled ahead at the time of transcription. These become ordinary past
  // days once their date passes, and will count toward streaks then.
  "2026-08-21": "push",
  "2026-08-22": "lower",
  "2026-08-24": "pull",
  "2026-08-25": "lower",
};

export function seedTrainedDays(): TrainedDaysMap {
  const days: TrainedDaysMap = {};
  for (const [date, split] of Object.entries(TRAINED_SEED)) {
    days[date] = { date, split };
  }
  return days;
}

export function isSeedDate(date: string): boolean {
  return date in TRAINED_SEED;
}
