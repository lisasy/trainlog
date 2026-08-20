import { loadPREntries, savePREntries } from "./prs";
import type { PREntry, TrainedDaysMap } from "./types";
import { loadTrainedDays, saveTrainedDays } from "./workouts";

/**
 * JSON export/import.
 *
 * localStorage doesn't sync, so this is the manual path between laptop and
 * phone — and the only backup that survives clearing site data.
 */

const FORMAT = "trainlog-backup";
const VERSION = 1;

export type Backup = {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  trainedDays: TrainedDaysMap;
  prEntries: PREntry[];
};

export function exportBackup(): string {
  const backup: Backup = {
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    trainedDays: loadTrainedDays(),
    prEntries: loadPREntries(),
  };
  return JSON.stringify(backup, null, 2);
}

export type ImportResult =
  | { ok: true; trainedDays: TrainedDaysMap; prEntries: PREntry[]; dayCount: number; prCount: number }
  | { ok: false; error: string };

/**
 * Replaces the whole log with the file's contents.
 *
 * Deliberately a replace rather than a merge: merging two divergent logs
 * without a sync model would silently invent a history that never happened.
 * The caller is expected to confirm before calling this.
 */
export function importBackup(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "not valid json" };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, error: "not a trainlog backup" };
  }

  const candidate = parsed as Partial<Backup>;
  if (candidate.format !== FORMAT) {
    return { ok: false, error: "not a trainlog backup" };
  }

  const trainedDays =
    typeof candidate.trainedDays === "object" && candidate.trainedDays !== null
      ? (candidate.trainedDays as TrainedDaysMap)
      : {};
  const prEntries = Array.isArray(candidate.prEntries) ? (candidate.prEntries as PREntry[]) : [];

  saveTrainedDays(trainedDays);
  savePREntries(prEntries);

  return {
    ok: true,
    trainedDays,
    prEntries,
    dayCount: Object.keys(trainedDays).length,
    prCount: prEntries.length,
  };
}

/** Filename stamped with the date, so successive exports don't collide. */
export function backupFilename(): string {
  return `trainlog-${new Date().toISOString().slice(0, 10)}.json`;
}
